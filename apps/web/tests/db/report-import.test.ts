import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminDb, dbAs } from '@/lib/db'
import { ensurePasswordUser } from '@/lib/auth-users'
import { EXAMPLE_REPORT } from '@/lib/biomarker-report/example'
import { careTeamPatients, findReport } from '@/lib/care-team/data'
import { createImportKey, IMPORT_KEY_PREFIX, ImportError, importKeys, importReport, revokeImportKey } from '@/lib/care-team/import'
import { acceptInvitation, inviteClinician, saveReport, setSharing, signOffReport } from '@/lib/care-team/manage'
import { reportEmails } from '@/lib/care-team/notify'
import { PROGRAM_TEMPLATES, programInputSchema } from '@/lib/programs/config'
import { findProgram, type Program } from '@/lib/programs/data'
import { joinProgram, saveProgram } from '@/lib/programs/manage'

// A clinic's treatment program (care team review), the laboratory's report
// import (db/migrations/20261023030000_table_instance_import_keys.sql) and the
// emails about reports (lib/care-team/notify.ts). See `pnpm test:db`.

const stamp = Date.now()
const slug = `import-${stamp}`
const otherSlug = `import-other-${stamp}`
const password = 'correct horse battery staple'
const userIds: string[] = []
type User = { id: string; email: string }
let owner: User
let clinician: User
let secondClinician: User
let patient: User
let chooser: User
let stranger: User
let instanceId: string
let otherInstanceId: string
let clinic: Program
let open: Program
let key: string

async function newUser(label: string, name = label): Promise<User> {
  const email = `import-${label}-${stamp}@example.com`
  const id = await ensurePasswordUser(email, name, password)
  userIds.push(id)
  return { id, email }
}

async function addClinician(member: User) {
  const result = await inviteClinician(owner, slug, member.email)
  if (!('invitationId' in result)) throw new Error('Expected an invitation')
  await acceptInvitation(member, result.invitationId)
}

const glp1 = PROGRAM_TEMPLATES.find((template) => template.key === 'glp-1')!
const programInput = (programSlug: string, careTeamReview: boolean) =>
  programInputSchema.parse({
    name: `${programSlug} program`,
    slug: programSlug,
    summary: '',
    followUpWeeks: '12',
    careTeamReview,
    items: JSON.stringify(glp1.items),
  })

/** The error that an import throws. */
async function importError(...args: Parameters<typeof importReport>): Promise<ImportError> {
  try {
    await importReport(...args)
  } catch (error) {
    if (error instanceof ImportError) return error
    throw error
  }
  throw new Error('The import did not fail.')
}

beforeAll(async () => {
  owner = await newUser('owner')
  clinician = await newUser('clinician', 'Dr. Import Clinician')
  secondClinician = await newUser('second-clinician', 'Dr. Second')
  patient = await newUser('patient', 'Pat Clinic')
  chooser = await newUser('chooser', 'Cho Oser')
  stranger = await newUser('stranger')

  instanceId = (await dbAs(owner).instances.create({ data: { slug, name: 'Import Clinic', owner_id: owner.id }, select: { id: true } })).id
  otherInstanceId = (
    await dbAs(stranger).instances.create({ data: { slug: otherSlug, name: 'Other Clinic', owner_id: stranger.id }, select: { id: true } })
  ).id
  await saveProgram(owner, slug, programInput('clinic', true))
  await saveProgram(owner, slug, programInput('open', false))
  clinic = (await findProgram(slug, 'clinic'))!
  open = (await findProgram(slug, 'open'))!
  await addClinician(clinician)
  await addClinician(secondClinician)
})

afterAll(async () => {
  await adminDb.biomarker_reports.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.instances.deleteMany({ where: { slug: { in: [slug, otherSlug] } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('a program with care team review', () => {
  it('shares the reports with the care team when the person joins, without a separate choice', async () => {
    expect(clinic.careTeamReview).toBe(true)
    expect(open.careTeamReview).toBe(false)
    await joinProgram(patient, clinic, { scheduleNotifications: false })
    await joinProgram(chooser, open, { scheduleNotifications: false })
    const listed = await careTeamPatients(clinician, { id: instanceId, slug })
    expect(listed.map((row) => [row.name, row.program.slug])).toEqual([['Pat Clinic', 'clinic']])
  })
})

describe('import keys', () => {
  it('are created and seen by the instance owner only, and the database keeps only a hash', async () => {
    const created = await createImportKey(owner, instanceId, 'Our laboratory')
    key = created.key
    expect(key.startsWith(IMPORT_KEY_PREFIX)).toBe(true)
    expect(await importKeys(owner, instanceId)).toEqual([
      { id: created.id, name: 'Our laboratory', prefix: key.slice(0, 12), createdAt: expect.any(Date), lastUsedAt: null },
    ])
    const row = await adminDb.instance_import_keys.findUniqueOrThrow({ where: { id: created.id }, select: { key_hash: true } })
    expect(row.key_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(row.key_hash).not.toContain(key)

    for (const outsider of [clinician, patient, stranger]) {
      expect(await importKeys(outsider, instanceId)).toEqual([])
    }
    await expect(createImportKey(stranger, instanceId, 'Not mine')).rejects.toThrow(/row-level security/)
    await expect(createImportKey(clinician, instanceId, 'Not mine')).rejects.toThrow(/row-level security/)
    expect(await revokeImportKey(stranger, created.id)).toBe(false)
  })
})

describe('a report import', () => {
  const body = (change: Record<string, unknown> = {}) => ({
    program: 'clinic',
    email: patient.email.toUpperCase(),
    externalId: `lab-${stamp}`,
    report: EXAMPLE_REPORT,
    ...change,
  })

  it('refuses a wrong key, a report that is not valid, and a person who does not share', async () => {
    expect(await importError('dfri_wrong', body())).toMatchObject({ status: 401 })
    const invalid = await importError(key, body({ report: { ...EXAMPLE_REPORT, timepoints: [EXAMPLE_REPORT.timepoints[0]] } }))
    expect(invalid).toMatchObject({ status: 400, message: 'The report is not valid.' })
    expect(invalid.details?.[0].path).toMatch(/^report\.timepoints/)
    expect(await importError(key, body({ email: 'not an email' }))).toMatchObject({ status: 400 })
    expect(await importError(key, body({ program: 'nope' }))).toMatchObject({ status: 404 })
    // In the program without care team review, this person did not choose to share.
    expect(await importError(key, body({ program: 'open', email: chooser.email }))).toMatchObject({ status: 404 })
    // A key works only for its own instance's programs and people.
    const other = await createImportKey(stranger, otherInstanceId, 'Their laboratory')
    expect(await importError(other.key, body())).toMatchObject({ status: 404 })
  })

  it('saves the report for the person and the care team, once for each externalId', async () => {
    const first = await importReport(key, body())
    expect(first).toEqual({ id: expect.any(String), created: true })
    expect(await findReport(patient, first.id)).toMatchObject({ title: EXAMPLE_REPORT.title, reviewedAt: null })
    expect(await findReport(clinician, first.id)).not.toBeNull()
    expect(await findReport(stranger, first.id)).toBeNull()
    const row = await adminDb.biomarker_reports.findUniqueOrThrow({ where: { id: first.id }, select: { uploaded_by: true, import_key_id: true } })
    expect(row.uploaded_by).toBeNull()
    expect(row.import_key_id).not.toBeNull()
    expect((await importKeys(owner, instanceId))[0].lastUsedAt).toEqual(expect.any(Date))

    // The laboratory sends it again: the same report.
    expect(await importReport(key, body())).toEqual({ id: first.id, created: false })
    // The same externalId for another person is a mistake.
    await joinProgram(chooser, clinic, { scheduleNotifications: false })
    expect(await importError(key, body({ email: chooser.email }))).toMatchObject({ status: 409 })
    // Without an externalId, each request is a new report.
    const again = await importReport(key, body({ externalId: undefined }))
    expect(again.created).toBe(true)
    expect(again.id).not.toBe(first.id)
  })

  it('is not something a clinician can claim for their own upload', async () => {
    await expect(
      dbAs(clinician).biomarker_reports.create({
        data: {
          program_id: clinic.id,
          user_id: patient.id,
          data: EXAMPLE_REPORT,
          title: 'Claimed',
          report_date: new Date(),
          uploaded_by: clinician.id,
          external_id: 'claimed',
        },
        select: { id: true },
      }),
    ).rejects.toThrow(/row-level security/)
  })

  it('stops when the owner revokes the key', async () => {
    const [current] = await importKeys(owner, instanceId)
    expect(await revokeImportKey(owner, current.id)).toBe(true)
    expect(await importKeys(owner, instanceId)).toEqual([])
    expect(await importError(key, body({ externalId: `lab-late-${stamp}` }))).toMatchObject({ status: 401 })
  })
})

describe('the emails about a report', () => {
  it('tell the person and the other clinicians that a report is added, and the person that it is reviewed', async () => {
    const reportId = await saveReport(clinician, { programId: clinic.id, patientId: patient.id, report: EXAMPLE_REPORT })
    const added = await reportEmails('added', reportId)
    expect(added.map((email) => [email.to, email.subject])).toEqual([
      [patient.email, 'You have a new biomarker report'],
      // Not the clinician who added it.
      [secondClinician.email, 'A biomarker report waits for review'],
    ])
    expect(added[0].text).toContain(`/programs/clinic/me/reports/${reportId}`)
    expect(added[1].text).toMatch(new RegExp(`/instances/${slug}/care/[0-9a-f-]{36}/reports/${reportId}`))
    expect(added.every((email) => email.fromName === 'Import Clinic')).toBe(true)

    await signOffReport(clinician, reportId, 'adjust', 'Lower the dose.')
    const reviewed = await reportEmails('reviewed', reportId)
    expect(reviewed.map((email) => [email.to, email.subject])).toEqual([[patient.email, 'Your biomarker report is reviewed']])
    expect(reviewed[0].text).toContain('Dr. Import Clinician')
    // No health data in email: not the note, not the decision.
    for (const email of [...added, ...reviewed]) {
      expect(`${email.text}${email.html}`).not.toMatch(/Lower the dose|adjust/i)
    }
  })

  it('go to every clinician for an imported report, and to nobody for a report that is gone', async () => {
    await setSharing(patient, clinic.id, true)
    const key2 = (await createImportKey(owner, instanceId, 'Second laboratory')).key
    const { id } = await importReport(key2, { program: 'clinic', email: patient.email, report: EXAMPLE_REPORT })
    expect((await reportEmails('added', id)).map((email) => email.to).sort()).toEqual(
      [patient.email, clinician.email, secondClinician.email].sort(),
    )
    expect(await reportEmails('added', '00000000-0000-4000-8000-000000000000')).toEqual([])
  })
})
