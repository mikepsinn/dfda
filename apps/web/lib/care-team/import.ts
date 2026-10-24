import { createHash, randomBytes } from 'node:crypto'
import { z } from 'zod'
import { adminDb, dbAs, isUniqueViolation, type DbUser } from '@/lib/db'
import { biomarkerReportSchema } from '@/lib/biomarker-report/schema'
import { withGeneratedText } from '@/lib/biomarker-report/text'

/**
 * Report import: a laboratory, or another system of the company, sends
 * biomarker reports to the company's care team with an import key of the
 * instance (POST /api/v1/biomarker-reports,
 * db/migrations/20261023030000_table_instance_import_keys.sql). The owner
 * creates and revokes the keys. An import checks the key and the report, then
 * saves the report as the care team would, for a member of the key's instance
 * who shares their reports with the care team. Server only.
 */

/** Import keys start with this, so that a key found in a file or a log is easy to recognize. */
export const IMPORT_KEY_PREFIX = 'dfri_'

export function hashImportKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/** A new random key, its hash and the first characters that the owner sees. */
export function newImportKey() {
  const key = `${IMPORT_KEY_PREFIX}${randomBytes(32).toString('base64url')}`
  return { key, hash: hashImportKey(key), prefix: key.slice(0, 12) }
}

export const importKeyNameSchema = z.string().trim().min(1, 'Name the key, for example after the laboratory.').max(80, 'Use at most 80 characters.')

export type ImportKey = { id: string; name: string; prefix: string; createdAt: Date; lastUsedAt: Date | null }

/** The import keys of an instance that `owner` owns and has not revoked, oldest first; empty for anyone else. */
export async function importKeys(owner: DbUser, instanceId: string): Promise<ImportKey[]> {
  const rows = await dbAs(owner).instance_import_keys.findMany({
    where: { instance_id: instanceId, revoked_at: null },
    select: { id: true, name: true, key_prefix: true, created_at: true, last_used_at: true },
    orderBy: { created_at: 'asc' },
  })
  return rows.map((row) => ({ id: row.id, name: row.name, prefix: row.key_prefix, createdAt: row.created_at, lastUsedAt: row.last_used_at }))
}

/** Creates an import key for the owner's instance. The result holds the key itself, which nobody can see again. */
export async function createImportKey(owner: DbUser, instanceId: string, name: string): Promise<{ id: string; key: string }> {
  const { key, hash, prefix } = newImportKey()
  const row = await dbAs(owner).instance_import_keys.create({
    data: { instance_id: instanceId, name: importKeyNameSchema.parse(name), key_hash: hash, key_prefix: prefix, created_by: owner.id },
    select: { id: true },
  })
  return { id: row.id, key }
}

/** Revokes an import key of the owner's instance; it stops working at once. */
export async function revokeImportKey(owner: DbUser, keyId: string): Promise<boolean> {
  const { count } = await dbAs(owner).instance_import_keys.updateMany({
    where: { id: keyId, revoked_at: null },
    data: { revoked_at: new Date() },
  })
  return count > 0
}

/** Why an import failed, with the HTTP status and error code of the API's answer. */
export class ImportError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: { path: string; message: string }[],
  ) {
    super(message)
  }
}

export const importRequestSchema = z.object({
  /** The program's address on the company's site, such as "glp-1". */
  program: z.string().trim().min(1, 'Required'),
  /** The email of the person's account. */
  email: z.string().trim().email(),
  /** The sender's own id of the report. A report sent again with the same id is not saved twice. */
  externalId: z.string().trim().min(1).max(200).optional(),
  report: z.unknown(),
})

const issues = (error: z.ZodError) => error.issues.slice(0, 10).map((issue) => ({ path: issue.path.join('.'), message: issue.message }))

/**
 * Saves the report in `body` with an import key. Returns the report's id, and
 * whether it is new: a report sent again with the same externalId returns the
 * saved one. Throws an ImportError for a key, request or person that is not
 * valid.
 */
export async function importReport(key: string, body: unknown): Promise<{ id: string; created: boolean }> {
  const importKey = await adminDb.instance_import_keys.findFirst({
    where: { key_hash: hashImportKey(key), revoked_at: null },
    select: { id: true, instance_id: true },
  })
  if (!importKey) throw new ImportError(401, 'UNAUTHENTICATED', 'The import key is not valid, or the company revoked it.')

  const request = importRequestSchema.safeParse(body)
  if (!request.success) throw new ImportError(400, 'INVALID_ARGUMENT', 'The request is not valid.', issues(request.error))
  const parsed = biomarkerReportSchema.safeParse(request.data.report)
  if (!parsed.success) {
    throw new ImportError(
      400,
      'INVALID_ARGUMENT',
      'The report is not valid.',
      issues(parsed.error).map((issue) => ({ ...issue, path: issue.path ? `report.${issue.path}` : 'report' })),
    )
  }
  const report = withGeneratedText(parsed.data)
  const { externalId } = request.data

  const program = await adminDb.instance_programs.findFirst({
    where: { instance_id: importKey.instance_id, slug: request.data.program },
    select: { id: true },
  })
  if (!program) throw new ImportError(404, 'NOT_FOUND', 'The company has no program with this address.')
  const enrollment = await adminDb.program_enrollments.findFirst({
    where: {
      program_id: program.id,
      shared_with_care_team_at: { not: null },
      profiles: { email: { equals: request.data.email, mode: 'insensitive' } },
    },
    select: { user_id: true },
  })
  if (!enrollment) {
    throw new ImportError(404, 'NOT_FOUND', 'No member of this program with this email shares their reports with the care team.')
  }

  const existing = async () => {
    if (!externalId) return null
    const row = await adminDb.biomarker_reports.findFirst({
      where: { program_id: program.id, external_id: externalId },
      select: { id: true, user_id: true },
    })
    if (row && row.user_id !== enrollment.user_id) {
      throw new ImportError(409, 'ALREADY_EXISTS', "This externalId is another person's report in this program.")
    }
    return row && { id: row.id, created: false }
  }
  const saved = await existing()
  if (saved) return saved

  let id: string
  try {
    id = (
      await adminDb.biomarker_reports.create({
        data: {
          program_id: program.id,
          user_id: enrollment.user_id,
          data: report,
          title: report.title,
          report_date: new Date(`${report.reportDate}T00:00:00Z`),
          import_key_id: importKey.id,
          external_id: externalId ?? null,
        },
        select: { id: true },
      })
    ).id
  } catch (error) {
    // The same report sent twice at once: the second one finds the first.
    const raced = isUniqueViolation(error) ? await existing() : null
    if (raced) return raced
    throw error
  }
  await adminDb.instance_import_keys.update({ where: { id: importKey.id }, data: { last_used_at: new Date() }, select: { id: true } })
  return { id, created: true }
}
