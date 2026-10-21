import { afterAll, describe, expect, it } from 'vitest'
import { adminDb } from '@/lib/db'
import { DEMO_CLINIC as demo, ensureDemoClinic, ensureDemoMembers, hasDemoMembers, resetDemoPatient } from '@/lib/demo/clinic'
import { personalReport } from '@/lib/programs/data'

// The demo clinic that the demo sign-in creates on a deployment
// (lib/demo/clinic.ts). Runs against the database from
// scripts/db-plain-setup.ts. See `pnpm test:db`.

const DAY = 86_400_000
const now = new Date('2026-10-21T15:00:00Z')
const emails = [
  demo.company.email,
  demo.patient.email,
  ...Array.from({ length: demo.people }, (_, index) => demo.memberEmail.replace('{n}', String(index + 1))),
]

afterAll(async () => {
  const users = await adminDb.users.findMany({ where: { email: { in: emails } }, select: { id: true } })
  const ids = users.map((user) => user.id)
  await adminDb.measurements.deleteMany({ where: { user_id: { in: ids } } })
  await adminDb.program_enrollments.deleteMany({ where: { program_id: demo.program.id } })
  await adminDb.instance_programs.deleteMany({ where: { id: demo.program.id } })
  await adminDb.instances.deleteMany({ where: { id: demo.instance.id } })
  await adminDb.users.deleteMany({ where: { id: { in: ids } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: ids } } })
  await adminDb.$disconnect()
})

describe('the demo clinic', () => {
  it('creates the company, instance, program and members once, and keeps changes that the owner makes', async () => {
    const first = await ensureDemoClinic()
    expect(first.program.items.map((item) => item.variableId)).toEqual(expect.arrayContaining(['weight', 'hba1c']))
    await adminDb.instances.update({ where: { id: demo.instance.id }, data: { name: 'Renamed by the owner' } })

    const second = await ensureDemoClinic()
    expect([second.ownerId, second.program.id]).toEqual([first.ownerId, first.program.id])
    expect((await adminDb.instances.findUnique({ where: { id: demo.instance.id }, select: { name: true } }))?.name).toBe(
      'Renamed by the owner',
    )

    expect(await hasDemoMembers(first.program)).toBe(false)
    expect(await ensureDemoMembers(first.program, now)).toBe(demo.people)
    expect(await ensureDemoMembers(first.program, now)).toBe(0)
    expect(await hasDemoMembers(first.program)).toBe(true)
  })

  it('gives the demo patient a program that ended two days ago, with the same values after each sign-in', async () => {
    const { program } = await ensureDemoClinic()
    const userId = await resetDemoPatient(program, now)
    const count = () => adminDb.measurements.count({ where: { user_id: userId } })
    const values = await count()
    expect(values).toBeGreaterThan(50)

    // A visitor records a value; the next sign-in replaces it.
    const weight = await adminDb.user_variables.findFirstOrThrow({ where: { user_id: userId, global_variable_id: 'weight' } })
    await adminDb.measurements.create({
      data: { user_id: userId, global_variable_id: 'weight', user_variable_id: weight.id, value: 300, unit_id: 'kilogram', start_at: now },
    })
    await resetDemoPatient(program, now)
    expect(await count()).toBe(values)

    const report = (await personalReport({ id: userId }, program))!
    const today = Math.floor(now.getTime() / DAY) * DAY
    expect(report.followUpAt.getTime()).toBe(today - 2 * DAY)
    expect(report.measures.some((measure) => measure.status === 'waiting')).toBe(false)
    const improved = report.measures.filter((measure) => measure.status === 'improved').length
    expect(improved).toBeGreaterThanOrEqual(Math.ceil(report.measures.length / 2))
  })
})
