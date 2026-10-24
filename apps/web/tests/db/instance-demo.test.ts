import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminDb, dbAs } from '@/lib/db'
import { ensurePasswordUser } from '@/lib/auth-users'
import { careLogs, careTeamPatients, findReport } from '@/lib/care-team/data'
import { signOffReport } from '@/lib/care-team/manage'
import { DemoUnavailable, instanceDemoProblem, prepareInstanceDemo } from '@/lib/demo/instance'
import { endInstanceDemo, instanceDemoAccounts } from '@/lib/demo/instance-accounts'
import { PROGRAM_TEMPLATES, programInputSchema } from '@/lib/programs/config'
import { findProgram, type Program } from '@/lib/programs/data'
import { joinProgram, saveProgram } from '@/lib/programs/manage'

// Demo mode of a company's site (lib/demo/instance.ts): the demo patient and
// clinician, and the end of the demo when a real person joins. See `pnpm test:db`.

const stamp = Date.now()
const slug = `site-demo-${stamp}`
const password = 'correct horse battery staple'
const userIds: string[] = []
let owner: { id: string }
let visitor: { id: string; email: string }
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
  userIds.push(owner.id, visitor.id)
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
    await adminDb.instances.update({ where: { id: instanceId }, data: { demo_enabled: true } })
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

  it('ends when a real person joins: the demo people leave before the person is in', async () => {
    const clinician = await demoUser('clinician')
    const patient = await demoUser('patient')
    await joinProgram(visitor, program, { scheduleNotifications: false })

    expect((await adminDb.instances.findUniqueOrThrow({ where: { id: instanceId } })).demo_enabled).toBe(false)
    // The demo clinician is off the care team, so they see nobody, the real person least of all.
    expect(await careTeamPatients(clinician, { id: instanceId, slug })).toEqual([])
    expect(await adminDb.program_enrollments.count({ where: { user_id: patient.id } })).toBe(0)
    expect(await adminDb.biomarker_reports.count({ where: { user_id: patient.id } })).toBe(0)
    await expect(prepareInstanceDemo(instanceId, 'clinician')).rejects.toBeInstanceOf(DemoUnavailable)
    expect(await instanceDemoProblem(instanceId)).toMatch(/nobody has joined/)
    // Ending it again changes nothing.
    await endInstanceDemo(instanceId)
  })
})
