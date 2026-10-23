import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminDb, dbAs } from '@/lib/db'
import { ensurePasswordUser } from '@/lib/auth-users'
import { EXAMPLE_REPORT } from '@/lib/biomarker-report/example'
import { careTeam, careTeamInvitations, careTeamPatients, findReport, invitationsFor, myReports } from '@/lib/care-team/data'
import {
  acceptInvitation,
  cancelInvitation,
  CareTeamError,
  inviteClinician,
  parseReportFile,
  removeClinician,
  removeReport,
  saveReport,
  setSharing,
  signOffReport,
} from '@/lib/care-team/manage'
import { PROGRAM_TEMPLATES, programInputSchema } from '@/lib/programs/config'
import { findProgram, type Program } from '@/lib/programs/data'
import { joinProgram, saveProgram } from '@/lib/programs/manage'

// Care teams and biomarker reports
// (db/migrations/20261021050000_table_care_teams_and_biomarker_reports.sql):
// who sees, adds and signs off a person's reports. Runs against the database
// from scripts/db-plain-setup.ts. See `pnpm test:db`.

const stamp = Date.now()
const slug = `care-${stamp}`
const otherSlug = `care-other-${stamp}`
const password = 'correct horse battery staple'
const userIds: string[] = []
type User = { id: string; email: string }
let owner: User
let clinician: User
let secondClinician: User
let otherClinician: User
let patient: User
let privatePerson: User
let stranger: User
let program: Program
let instance: { id: string; slug: string }
let reportId: string

async function newUser(label: string, name = label): Promise<User> {
  const email = `care-${label}-${stamp}@example.com`
  const id = await ensurePasswordUser(email, name, password)
  userIds.push(id)
  return { id, email }
}

/** The id of a new invitation; the test fails when the owner was added at once instead. */
async function invitationId(inviter: User, instanceSlug: string, email: string): Promise<string> {
  const result = await inviteClinician(inviter, instanceSlug, email)
  if (!('invitationId' in result)) throw new Error(`Expected an invitation for ${email}`)
  return result.invitationId
}

/** Invites the member, who accepts. */
async function join(inviter: User, instanceSlug: string, member: User) {
  expect(await acceptInvitation(member, await invitationId(inviter, instanceSlug, member.email))).toBe(instanceSlug)
}

const glp1 = PROGRAM_TEMPLATES.find((template) => template.key === 'glp-1')!
const input = programInputSchema.parse({
  name: glp1.name,
  slug: 'glp-1',
  summary: glp1.summary,
  followUpWeeks: '12',
  items: JSON.stringify(glp1.items),
})

beforeAll(async () => {
  owner = await newUser('owner')
  clinician = await newUser('clinician', 'Dr. Test Clinician')
  secondClinician = await newUser('second-clinician', 'Dr. Second Clinician')
  otherClinician = await newUser('other-clinician')
  patient = await newUser('patient', 'Pat Shares')
  privatePerson = await newUser('private')
  stranger = await newUser('stranger')

  instance = await dbAs(owner).instances.create({ data: { slug, name: 'Care Clinic', owner_id: owner.id }, select: { id: true, slug: true } })
  await dbAs(stranger).instances.create({ data: { slug: otherSlug, name: 'Other Clinic', owner_id: stranger.id }, select: { id: true } })
  await saveProgram(owner, slug, input)
  program = (await findProgram(slug, 'glp-1'))!

  await join(owner, slug, clinician)
  await join(owner, slug, secondClinician)
  await join(stranger, otherSlug, otherClinician)
  await joinProgram(patient, program, { scheduleNotifications: false, shareWithCareTeam: true })
  await joinProgram(privatePerson, program, { scheduleNotifications: false })
})

afterAll(async () => {
  // Reports keep their program (ON DELETE RESTRICT), so they go first.
  await adminDb.biomarker_reports.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.instances.deleteMany({ where: { slug: { in: [slug, otherSlug] } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('the care team', () => {
  it('is changed only by the instance owner', async () => {
    expect((await careTeam(owner, instance.id)).map((member) => member.name)).toEqual(['Dr. Test Clinician', 'Dr. Second Clinician'])
    expect(await careTeam(clinician, instance.id)).toEqual([])

    await expect(inviteClinician(stranger, slug, `someone-${stamp}@example.com`)).rejects.toThrow(CareTeamError)
    await expect(
      dbAs(clinician).instance_clinicians.create({ data: { instance_id: instance.id, user_id: stranger.id }, select: { user_id: true } }),
    ).rejects.toThrow(/row-level security/)
    await expect(inviteClinician(owner, slug, clinician.email.toUpperCase())).rejects.toThrow('already on the care team')
  })

  it('lists only the people who share their reports, and only for its own clinicians', async () => {
    const listed = await careTeamPatients(clinician, instance)
    expect(listed.map((row) => [row.name, row.program.slug])).toEqual([['Pat Shares', 'glp-1']])
    for (const outsider of [owner, otherClinician, stranger, patient]) {
      expect(await careTeamPatients(outsider, instance)).toEqual([])
    }
  })
})

describe('biomarker reports', () => {
  it('checks a report file before it is saved', () => {
    expect(parseReportFile('not json')).toEqual({ errors: ['The file is not valid JSON.'] })
    const broken = parseReportFile(JSON.stringify({ ...EXAMPLE_REPORT, timepoints: [EXAMPLE_REPORT.timepoints[0]] }))
    expect('errors' in broken && broken.errors[0]).toMatch(/^timepoints/)
    expect(parseReportFile(JSON.stringify(EXAMPLE_REPORT))).toEqual({ report: EXAMPLE_REPORT })
    // A file of values alone: the upload writes the summaries from the numbers (lib/biomarker-report/text.ts).
    const bare = parseReportFile(JSON.stringify({ ...EXAMPLE_REPORT, glance: undefined, panels: EXAMPLE_REPORT.panels.map((panel) => ({ ...panel, summary: undefined })) }))
    expect('report' in bare && bare.report.panels[0].summary).toMatch(/^10 of 12 proteins moved/)
    expect('report' in bare && bare.report.glance?.unchanged).toBe("No protein in these panels moved beyond this patient's own noise.")
  })

  it('are added by the care team for a person who shares, and read by that person', async () => {
    reportId = await saveReport(clinician, { programId: program.id, patientId: patient.id, report: EXAMPLE_REPORT })
    expect(await findReport(patient, reportId)).toMatchObject({ title: EXAMPLE_REPORT.title, reviewedAt: null, report: EXAMPLE_REPORT })
    expect((await myReports(patient, program.id)).map((report) => report.id)).toEqual([reportId])
    expect((await careTeamPatients(clinician, instance))[0].reports.map((report) => report.id)).toEqual([reportId])

    for (const outsider of [owner, otherClinician, stranger, privatePerson]) {
      expect(await findReport(outsider, reportId)).toBeNull()
    }
    expect(await dbAs(null).biomarker_reports.count()).toBe(0)
  })

  it('cannot be added for a person who does not share, or by anyone outside the care team', async () => {
    await expect(saveReport(clinician, { programId: program.id, patientId: privatePerson.id, report: EXAMPLE_REPORT })).rejects.toThrow(
      CareTeamError,
    )
    for (const outsider of [owner, otherClinician, patient]) {
      await expect(saveReport(outsider, { programId: program.id, patientId: patient.id, report: EXAMPLE_REPORT })).rejects.toThrow(
        CareTeamError,
      )
    }
  })

  it('are signed off under the clinician account name, and the sign-off changes nothing else', async () => {
    for (const outsider of [otherClinician, owner, patient]) {
      await expect(signOffReport(outsider, reportId, 'continue', 'Not mine to sign')).rejects.toThrow(CareTeamError)
    }
    await signOffReport(clinician, reportId, 'continue', 'Keep the dose. Recheck at week 16.')
    expect(await findReport(patient, reportId)).toMatchObject({
      reviewerName: 'Dr. Test Clinician',
      reviewNote: 'Keep the dose. Recheck at week 16.',
      reviewDecision: 'continue',
      reviewedAt: expect.any(Date),
    })

    // A second sign-off does not replace the first, also when both clinicians opened the report before it.
    await expect(signOffReport(secondClinician, reportId, 'adjust', 'A later note')).rejects.toThrow(CareTeamError)
    expect(await findReport(patient, reportId)).toMatchObject({
      reviewerName: 'Dr. Test Clinician',
      reviewNote: 'Keep the dose. Recheck at week 16.',
      reviewDecision: 'continue',
    })

    // Only the review columns may change, and only as the clinician's own review.
    await expect(
      dbAs(clinician).biomarker_reports.update({ where: { id: reportId }, data: { title: 'Changed' }, select: { id: true } }),
    ).rejects.toThrow(/permission denied/)
    const open = await saveReport(clinician, { programId: program.id, patientId: patient.id, report: EXAMPLE_REPORT })
    await expect(
      dbAs(clinician).biomarker_reports.update({
        where: { id: open },
        data: { reviewed_by: owner.id, reviewed_at: new Date() },
        select: { id: true },
      }),
    ).rejects.toThrow(/row-level security/)
    await removeReport(clinician, open)
    expect(await findReport(patient, reportId)).toMatchObject({ title: EXAMPLE_REPORT.title, reviewerName: 'Dr. Test Clinician' })
  })

  it('have a decision only with the sign-off, and only one of the four decisions', async () => {
    const open = await saveReport(clinician, { programId: program.id, patientId: patient.id, report: EXAMPLE_REPORT })
    await expect(
      dbAs(clinician).biomarker_reports.update({ where: { id: open }, data: { review_decision: 'adjust' }, select: { id: true } }),
    ).rejects.toThrow(/row-level security/)
    // An open report has no decision, also when an administrator writes one.
    await adminDb.biomarker_reports.update({ where: { id: open }, data: { review_decision: 'adjust' }, select: { id: true } })
    expect(await findReport(clinician, open)).toMatchObject({ reviewedAt: null, reviewDecision: null })
    await expect(
      dbAs(clinician).biomarker_reports.update({
        where: { id: open },
        data: { reviewed_by: clinician.id, reviewed_at: new Date(), review_decision: 'stop' },
        select: { id: true },
      }),
    ).rejects.toThrow(/check constraint/)
    await removeReport(clinician, open)
  })

  it('can be removed while nobody has signed them off', async () => {
    await expect(removeReport(clinician, reportId)).rejects.toThrow(CareTeamError)
    const open = await saveReport(clinician, { programId: program.id, patientId: patient.id, report: EXAMPLE_REPORT })
    await expect(removeReport(otherClinician, open)).rejects.toThrow(CareTeamError)
    await removeReport(clinician, open)
    expect(await findReport(patient, open)).toBeNull()
    expect(await findReport(patient, reportId)).not.toBeNull()
  })

  it('stop reaching the care team when the person stops sharing', async () => {
    await setSharing(patient, program.id, false)
    expect(await careTeamPatients(clinician, instance)).toEqual([])
    expect(await findReport(clinician, reportId)).toBeNull()
    expect(await findReport(patient, reportId)).not.toBeNull()

    await setSharing(patient, program.id, true)
    expect(await findReport(clinician, reportId)).not.toBeNull()
  })

  it("keep the reviewer's name when the reviewer's account is deleted", async () => {
    const signed = await saveReport(clinician, { programId: program.id, patientId: patient.id, report: EXAMPLE_REPORT })
    await signOffReport(secondClinician, signed, 'investigate', 'Signed before leaving.')
    // Deleting the account deletes the profile too (handle_deleted_app_user), which clears reviewed_by.
    await adminDb.users.delete({ where: { id: secondClinician.id } })
    expect(await adminDb.profiles.count({ where: { id: secondClinician.id } })).toBe(0)
    expect(await findReport(patient, signed)).toMatchObject({ reviewerName: 'Dr. Second Clinician', reviewNote: 'Signed before leaving.' })
  })
})

describe('invitations to the care team', () => {
  it('give the owner the same result whether or not an account uses the email', async () => {
    const nobody = `nobody-${stamp}@example.com`
    const known = await inviteClinician(owner, slug, privatePerson.email)
    const unknown = await inviteClinician(owner, slug, nobody)
    expect(Object.keys(known)).toEqual(Object.keys(unknown))
    // Inviting again renews the invitation.
    expect(await inviteClinician(owner, slug, ` ${privatePerson.email.toUpperCase()} `)).toEqual(known)
    expect((await careTeamInvitations(owner, instance.id)).map((row) => row.email).sort()).toEqual([nobody, privatePerson.email].sort())
  })

  it('are seen and accepted only by the account with the invited, verified email', async () => {
    const id = await invitationId(owner, slug, privatePerson.email)
    for (const outsider of [clinician, stranger, patient]) {
      expect(await dbAs(outsider).care_team_invitations.findMany({ select: { id: true } })).toEqual([])
      expect(await acceptInvitation(outsider, id)).toBeNull()
    }
    expect(await careTeamInvitations(clinician, instance.id)).toEqual([])
    expect(await acceptInvitation(privatePerson, 'not-an-id')).toBeNull()

    await adminDb.users.update({ where: { id: privatePerson.id }, data: { emailVerified: false } })
    try {
      expect(await invitationsFor(privatePerson)).toEqual([])
      expect(await acceptInvitation(privatePerson, id)).toBeNull()
    } finally {
      await adminDb.users.update({ where: { id: privatePerson.id }, data: { emailVerified: true } })
    }

    expect(await invitationsFor(privatePerson)).toEqual([{ id, instance: { slug, name: 'Care Clinic' } }])
    expect(await acceptInvitation(privatePerson, id)).toBe(slug)
    expect((await careTeam(owner, instance.id)).map((member) => member.userId)).toContain(privatePerson.id)
    expect(await invitationsFor(privatePerson)).toEqual([])
    expect(await acceptInvitation(privatePerson, id)).toBeNull()
    await removeClinician(owner, slug, privatePerson.id)
  })

  it('add the owner at once for their own email', async () => {
    expect(await inviteClinician(owner, slug, owner.email)).toEqual({ addedOwner: true })
    await expect(inviteClinician(owner, slug, owner.email)).rejects.toThrow('You are already on the care team.')
    expect((await careTeam(owner, instance.id)).map((member) => member.userId)).toContain(owner.id)
    await removeClinician(owner, slug, owner.id)
  })

  it('are cancelled only by the owner', async () => {
    const email = `cancel-${stamp}@example.com`
    const id = await invitationId(owner, slug, email)
    await cancelInvitation(stranger, slug, id)
    expect((await careTeamInvitations(owner, instance.id)).map((row) => row.id)).toContain(id)
    await cancelInvitation(owner, slug, id)
    expect((await careTeamInvitations(owner, instance.id)).map((row) => row.id)).not.toContain(id)
  })
})
