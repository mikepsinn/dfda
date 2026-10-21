import { adminDb, dbAs, isRecordNotFound, isUniqueViolation, type DbUser } from '@/lib/db'
import { biomarkerReportSchema, type BiomarkerReport } from '@/lib/biomarker-report/schema'

/**
 * Changes to care teams, sharing and biomarker reports, with the user's own
 * permissions; the database refuses what the user may not do (see
 * lib/care-team/data.ts). Server only.
 */

export class CareTeamError extends Error {}

/** The largest report file that the care team can add. */
export const MAX_REPORT_FILE_BYTES = 1_000_000

/** A report file (lib/biomarker-report/schema.ts), checked; or what is wrong with it, at most 10 problems. */
export function parseReportFile(text: string): { report: BiomarkerReport } | { errors: string[] } {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { errors: ['The file is not valid JSON.'] }
  }
  const parsed = biomarkerReportSchema.safeParse(json)
  if (parsed.success) return { report: parsed.data }
  return {
    errors: parsed.error.issues.slice(0, 10).map((issue) => (issue.path.length ? `${issue.path.join('.')}: ${issue.message}` : issue.message)),
  }
}

/** Saves a checked report for a person who shares their reports with the user's care team. Returns its id. */
export async function saveReport(user: DbUser, input: { programId: string; patientId: string; report: BiomarkerReport }) {
  try {
    const row = await dbAs(user).biomarker_reports.create({
      data: {
        program_id: input.programId,
        user_id: input.patientId,
        data: input.report,
        title: input.report.title,
        report_date: new Date(`${input.report.reportDate}T00:00:00Z`),
        uploaded_by: user.id,
      },
      select: { id: true },
    })
    return row.id
  } catch (error) {
    if (error instanceof Error && /row-level security/.test(error.message)) {
      throw new CareTeamError('This person does not share their reports with your care team.')
    }
    throw error
  }
}

/** Signs off a report as the user, with an optional note for the person. */
export async function signOffReport(user: DbUser, reportId: string, note: string) {
  try {
    await dbAs(user).biomarker_reports.update({
      where: { id: reportId },
      data: { reviewed_by: user.id, reviewed_at: new Date(), review_note: note.trim() || null },
      select: { id: true },
    })
  } catch (error) {
    if (isRecordNotFound(error)) throw new CareTeamError('This report does not exist, or you cannot review it.')
    throw error
  }
}

/** Removes a report that nobody has signed off yet. */
export async function removeReport(user: DbUser, reportId: string) {
  const { count } = await dbAs(user).biomarker_reports.deleteMany({ where: { id: reportId, reviewed_at: null } })
  if (count === 0) throw new CareTeamError('Only a report that nobody has signed off yet can be removed.')
}

/** Starts or stops sharing the user's reports in a program with the instance's care team. */
export async function setSharing(user: DbUser, programId: string, share: boolean) {
  await dbAs(user).program_enrollments.updateMany({
    where: { program_id: programId, user_id: user.id },
    data: { shared_with_care_team_at: share ? new Date() : null },
  })
}

/**
 * Adds the account with this email to the care team of the owner's instance.
 * The account must exist: the clinician signs in once first.
 */
export async function addClinician(owner: DbUser, instanceSlug: string, email: string) {
  const instance = await dbAs(owner).instances.findFirst({ where: { slug: instanceSlug, owner_id: owner.id }, select: { id: true } })
  if (!instance) throw new CareTeamError('This instance does not exist, or it is not yours.')
  // The owner may not read other profiles; the server looks up only the id of this one email.
  const profile = await adminDb.profiles.findUnique({ where: { email: email.trim().toLowerCase() }, select: { id: true } })
  if (!profile) throw new CareTeamError('No account uses this email. Ask the clinician to sign in once, then add them.')
  try {
    await dbAs(owner).instance_clinicians.create({ data: { instance_id: instance.id, user_id: profile.id }, select: { user_id: true } })
  } catch (error) {
    if (isUniqueViolation(error)) throw new CareTeamError('This clinician is already on the care team.')
    throw error
  }
}

/** Removes a clinician from the care team of the owner's instance. */
export async function removeClinician(owner: DbUser, instanceSlug: string, userId: string) {
  await dbAs(owner).instance_clinicians.deleteMany({
    where: { user_id: userId, instances: { slug: instanceSlug, owner_id: owner.id } },
  })
}
