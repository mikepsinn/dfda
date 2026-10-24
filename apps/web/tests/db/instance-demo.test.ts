import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminDb, dbAs, type Prisma } from '@/lib/db'
import { ensurePasswordUser } from '@/lib/auth-users'
import { careLogs, careTeamPatients, findReport } from '@/lib/care-team/data'
import { signOffReport } from '@/lib/care-team/manage'
import { reportEmails } from '@/lib/care-team/notify'
import { casePreview } from '@/lib/instance/case-preview'
import { DemoUnavailable, instanceDemoProblem, prepareInstanceDemo, startInstanceDemo } from '@/lib/demo/instance'
import { demoLockKey, endInstanceDemo, instanceDemoAccounts } from '@/lib/demo/instance-accounts'
import { PROGRAM_TEMPLATES, programInputSchema } from '@/lib/programs/config'
import { findProgram, programDashboard, type Program } from '@/lib/programs/data'
import { joinProgram, saveProgram } from '@/lib/programs/manage'

// Demo mode of a company's site (lib/demo/instance.ts): the demo patient and
// clinician, who stay apart from the real members and the real care team, and
// the end of the demo. See `pnpm test:db`.

const stamp = Date.now()
const slug = `site-demo-${stamp}`
const password = 'correct horse battery staple'
const userIds: string[] = []
let owner: { id: string }
let visitor: { id: string; email: string }
let realClinician: { id: string; email: string }
let instanceId: string
let program: Program

const glp1 = PROGRAM_TEMPLATES.find((template) => template.key === 'glp-1')!

async function demoUser(role: 'patient' | 'clinician') {
  const email = instanceDemoAccounts(instanceId)[role]
  const user = await adminDb.users.findUniqueOrThrow({ where: { email }, select: { id: true } })
  return user
}

beforeAll(async () => {
  owner = { id: await ensurePasswordUser(`site-demo-owner-${stamp}@example.com`, 'Owner', password) }
  const visitorEmail = `site-demo-visitor-${stamp}@example.com`
  visitor = { id: await ensurePasswordUser(visitorEmail, 'Real Person', password), email: visitorEmail }
  const clinicianEmail = `site-demo-clinician-${stamp}@example.com`
  realClinician = { id: await ensurePasswordUser(clinicianEmail, 'Real Clinician', password), email: clinicianEmail }
  userIds.push(owner.id, visitor.id, realClinician.id)
  instanceId = (await dbAs(owner).instances.create({ data: { slug, name: 'Site Demo Clinic', owner_id: owner.id }, select: { id: true } })).id
})

afterAll(async () => {
  const demoIds = (
    await adminDb.users.findMany({ where: { email: { in: [instanceDemoAccounts(instanceId).patient, instanceDemoAccounts(instanceId).clinician] } }, select: { id: true } })
  ).map((user) => user.id)
  await adminDb.biomarker_reports.deleteMany({ where: { user_id: { in: [...userIds, ...demoIds] } } })
  await adminDb.instances.deleteMany({ where: { slug } })
  await adminDb.users.deleteMany({ where: { id: { in: [...userIds, ...demoIds] } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: [...userIds, ...demoIds] } } })
  await adminDb.$disconnect()
})

describe("a company site's demo", () => {
  it('needs a program before the owner can turn it on', async () => {
    expect(await instanceDemoProblem(instanceId)).toMatch(/Add a program first/)
    await saveProgram(
      owner,
      slug,
      programInputSchema.parse({ name: 'GLP-1', slug: 'glp-1', summary: '', followUpWeeks: '12', items: JSON.stringify(glp1.items) }),
    )
    program = (await findProgram(slug, 'glp-1'))!
    expect(await instanceDemoProblem(instanceId)).toBeNull()
    await expect(prepareInstanceDemo(instanceId, 'clinician')).rejects.toBeInstanceOf(DemoUnavailable)
    expect(await startInstanceDemo(instanceId)).toBeNull()
  })

  it("shows the demo patient's case on the home page of a site with care team review", () => {
    expect(program.careTeamReview).toBe(true)
    const preview = casePreview('Site Demo Clinic', [program])
    expect(preview).toMatchObject({ patientName: 'Riley Lee', programName: program.name, followUpWeeks: 12 })
    expect(preview!.headline).toHaveLength(4)
    expect(preview!.timeline.lanes.map((lane) => lane.name)).toContain(program.items.find((item) => item.kind === 'dose')!.name)
    expect(casePreview('Site Demo Clinic', [{ ...program, careTeamReview: false }])).toBeNull()
  })

  it('gives the demo clinician one patient, with logs and the example report to sign off', async () => {
    const opened = await prepareInstanceDemo(instanceId, 'clinician')
    expect(opened.email).toBe(instanceDemoAccounts(instanceId).clinician)
    const clinician = await demoUser('clinician')
    const patients = await careTeamPatients(clinician, { id: instanceId, slug })
    expect(patients.map((patient) => [patient.enrollmentId, patient.name])).toEqual([[opened.enrollmentId, 'Riley Lee']])
    expect((await careLogs(patients[0])).size).toBeGreaterThan(0)
    const [report] = patients[0].reports
    expect(report.reviewedAt).toBeNull()

    await signOffReport(clinician, report.id, 'continue', 'Keep the dose.')
    // The patient's sign-in keeps the review, so that they see it; the next clinician gets the report to sign off.
    await prepareInstanceDemo(instanceId, 'patient')
    expect(await findReport(clinician, report.id)).toMatchObject({ reviewNote: 'Keep the dose.' })
    await prepareInstanceDemo(instanceId, 'clinician')
    expect(await findReport(clinician, report.id)).toMatchObject({ reviewedAt: null, reviewNote: null })
  })

  it('ends only after a demo sign-in in progress, so that the sign-in cannot put the demo clinician back', async () => {
    // A transaction that holds the demo's lock stands for a sign-in in progress.
    let signInDone = false
    const signIn = adminDb.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${demoLockKey(instanceId)}))`
      await new Promise((resolve) => setTimeout(resolve, 300))
      signInDone = true
    })
    await new Promise((resolve) => setTimeout(resolve, 50))
    await endInstanceDemo(instanceId)
    expect(signInDone).toBe(true)
    await signIn
    expect(await startInstanceDemo(instanceId)).toBeNull()
    await prepareInstanceDemo(instanceId, 'clinician')
  })

  it('stays on when a real person joins: the demo clinician sees only the demo patient, the real care team only the real person', async () => {
    const demoClinician = await demoUser('clinician')
    const demoPatient = await demoUser('patient')
    await adminDb.instance_clinicians.create({ data: { instance_id: instanceId, user_id: realClinician.id } })
    await joinProgram(visitor, program, { scheduleNotifications: false, shareWithCareTeam: true })
    expect((await adminDb.instances.findUniqueOrThrow({ where: { id: instanceId } })).demo_enabled).toBe(true)
    expect(await instanceDemoProblem(instanceId)).toBeNull()

    const names = async (user: { id: string }) => (await careTeamPatients(user, { id: instanceId, slug })).map((patient) => patient.name)
    expect(await names(demoClinician)).toEqual(['Riley Lee'])
    expect(await names(realClinician)).toEqual(['Real Person'])

    // Reports follow the same rule.
    const demoReport = await adminDb.biomarker_reports.findFirstOrThrow({ where: { user_id: demoPatient.id }, select: { id: true, data: true, title: true, report_date: true } })
    const { id: realReportId } = await adminDb.biomarker_reports.create({
      data: { program_id: program.id, user_id: visitor.id, data: demoReport.data as Prisma.InputJsonValue, title: demoReport.title, report_date: demoReport.report_date },
      select: { id: true },
    })
    expect(await findReport(demoClinician, realReportId)).toBeNull()
    expect(await findReport(realClinician, demoReport.id)).toBeNull()
    expect(await findReport(realClinician, realReportId)).toMatchObject({ id: realReportId })
    await expect(signOffReport(demoClinician, realReportId, 'continue', 'Keep the dose.')).rejects.toThrow()

    // The totals count the real person only, and no email goes to or about a demo account.
    expect((await programDashboard(owner.id, program)).enrolled).toBe(1)
    expect(await reportEmails('added', demoReport.id)).toEqual([])
    const emails = (await reportEmails('added', realReportId)).map((email) => email.to)
    expect(emails).toEqual([visitor.email, realClinician.email])

    // A demo sign-in after the join still works.
    await prepareInstanceDemo(instanceId, 'clinician')
    expect(await names(demoClinician)).toEqual(['Riley Lee'])
  })

  it('ends when the owner turns it off: the demo people leave, the real person stays', async () => {
    const demoClinician = await demoUser('clinician')
    const demoPatient = await demoUser('patient')
    await endInstanceDemo(instanceId)
    expect((await adminDb.instances.findUniqueOrThrow({ where: { id: instanceId } })).demo_enabled).toBe(false)
    expect(await careTeamPatients(demoClinician, { id: instanceId, slug })).toEqual([])
    expect(await adminDb.program_enrollments.count({ where: { user_id: demoPatient.id } })).toBe(0)
    expect(await adminDb.biomarker_reports.count({ where: { user_id: demoPatient.id } })).toBe(0)
    expect(await adminDb.program_enrollments.count({ where: { user_id: visitor.id } })).toBe(1)
    await expect(prepareInstanceDemo(instanceId, 'clinician')).rejects.toBeInstanceOf(DemoUnavailable)
    // Ending it again changes nothing.
    await endInstanceDemo(instanceId)
  })
})
