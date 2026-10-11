import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { adminDb, dbAs } from '@/lib/db'
import { ensurePasswordUser } from '@/lib/auth-users'
import { PROGRAM_TEMPLATES, programInputSchema, usableTemplate } from '@/lib/programs/config'
import { findProgram, personalReport, programDashboard, variableOptions, type Program } from '@/lib/programs/data'
import { joinProgram, leaveProgram, recordProgramValues, saveProgram } from '@/lib/programs/manage'
import { MIN_GROUP_SIZE } from '@/lib/programs/report'

// Programs of company instances: who may change them, joining, values, the
// before/after report and the company totals. Runs against the database from
// scripts/db-plain-setup.ts. See `pnpm test:db`.

const DAY = 86_400_000
const stamp = Date.now()
const instanceSlug = `programs-${stamp}`
const password = 'correct horse battery staple'
const userIds: string[] = []
let owner: { id: string }
let other: { id: string }
let member: { id: string }
let program: Program

const glp1 = PROGRAM_TEMPLATES.find((template) => template.key === 'glp-1')!
const input = (slug = 'glp-1') =>
  programInputSchema.parse({ name: glp1.name, slug, summary: glp1.summary, followUpWeeks: '12', items: JSON.stringify(glp1.items) })
const isoDate = (time: number) => new Date(time).toISOString().slice(0, 10)

async function newUser(label: string) {
  const id = await ensurePasswordUser(`program-${label}-${stamp}@example.com`, label, password)
  userIds.push(id)
  return { id }
}

beforeAll(async () => {
  owner = await newUser('owner')
  other = await newUser('other')
  member = await newUser('member')
  await dbAs(owner).instances.create({ data: { slug: instanceSlug, name: 'Acme Metabolic', owner_id: owner.id }, select: { id: true } })
})

afterAll(async () => {
  await adminDb.instances.deleteMany({ where: { slug: instanceSlug } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('saving a program', () => {
  it('has every template variable in the seeded catalog', async () => {
    const variables = await variableOptions()
    for (const template of PROGRAM_TEMPLATES) {
      expect(usableTemplate(template, variables).items).toEqual(template.items)
    }
  })

  it('lets the instance owner create a program that anyone can read', async () => {
    await saveProgram(owner, instanceSlug, input())
    program = (await findProgram(instanceSlug, 'glp-1'))!
    expect(program.items.map((item) => [item.kind, item.variableId])).toEqual(glp1.items.map((item) => [item.kind, item.variableId]))
    expect(program.items.find((item) => item.variableId === 'hba1c')).toMatchObject({ unit: '%', better: 'lower', frequency: null })
  })

  it('refuses another user, also when they write to the tables directly', async () => {
    await expect(saveProgram(other, instanceSlug, input('glp-1-copy'))).rejects.toThrow('not yours')
    await expect(
      dbAs(other).instance_programs.create({
        data: { instance_id: program.instanceId, slug: 'taken-over', name: 'Taken over' },
        select: { id: true },
      }),
    ).rejects.toThrow()
    const { count } = await dbAs(other).instance_program_items.deleteMany({ where: { program_id: program.id } })
    expect(count).toBe(0)
  })

  it('replaces the items when the owner changes the program', async () => {
    const changed = { ...input(), items: input().items.filter((item) => item.kind !== 'lab' || item.variableId === 'hba1c') }
    await saveProgram(owner, instanceSlug, changed, 'glp-1')
    program = (await findProgram(instanceSlug, 'glp-1'))!
    expect(program.items.filter((item) => item.kind === 'lab').map((item) => item.variableId)).toEqual(['hba1c'])
  })
})

describe('joining', () => {
  it('records the start, makes the member a patient and sets a reminder for each dose and check-in', async () => {
    const result = await joinProgram(member, program)
    expect(result.joined).toBe(true)
    expect(result.reminders).toHaveLength(program.items.filter((item) => item.kind !== 'lab').length)
    const profile = await adminDb.profiles.findUnique({ where: { id: member.id }, select: { user_type: true } })
    expect(profile?.user_type).toBe('patient')
    const reminders = await adminDb.reminder_schedules.findMany({
      where: { user_id: member.id },
      select: { rrule: true, user_variables: { select: { global_variable_id: true } } },
    })
    const weekly = reminders.filter((reminder) => reminder.rrule.includes('FREQ=WEEKLY'))
    expect(weekly.map((reminder) => reminder.user_variables.global_variable_id).sort()).toEqual(['semaglutide', 'weight'])
  })

  it('does nothing when the member joins again', async () => {
    expect(await joinProgram(member, program)).toEqual({ joined: false, reminders: [] })
    expect(await adminDb.reminder_schedules.count({ where: { user_id: member.id } })).toBe(4)
  })

  it('keeps enrollments from the instance owner', async () => {
    expect(await dbAs(owner).program_enrollments.findMany({ where: { program_id: program.id } })).toEqual([])
    expect(await dbAs(member).program_enrollments.count({ where: { program_id: program.id } })).toBe(1)
  })
})

describe('values and the report', () => {
  it('records lab results in the variable unit and refuses values off the scale or in the future', async () => {
    // The member started 30 days ago; the first lab is from before the start.
    await adminDb.program_enrollments.updateMany({
      where: { program_id: program.id, user_id: member.id },
      data: { started_at: new Date(Date.now() - 30 * DAY) },
    })
    const hba1c = program.items.find((item) => item.variableId === 'hba1c')!
    const energy = program.items.find((item) => item.variableId === 'energy-level')!
    expect(await recordProgramValues(member, program, 'lab', isoDate(Date.now() - 32 * DAY), { [hba1c.id]: '6.2' })).toBe(1)
    await expect(recordProgramValues(member, program, 'today', isoDate(Date.now()), { [energy.id]: '11' })).rejects.toThrow(
      'Energy: enter a number from 0 to 10.',
    )
    await expect(recordProgramValues(member, program, 'lab', isoDate(Date.now() + 3 * DAY), { [hba1c.id]: '6' })).rejects.toThrow(
      'The date is in the future.',
    )
    // JavaScript would read February 31 as March 3.
    await expect(recordProgramValues(member, program, 'lab', '2026-02-31', { [hba1c.id]: '6' })).rejects.toThrow('Enter the date.')
    const stored = await adminDb.measurements.findFirst({
      where: { user_id: member.id, global_variable_id: 'hba1c' },
      select: { value: true, unit_id: true },
    })
    expect(stored).toEqual({ value: 6.2, unit_id: 'percent' })
  })

  it('compares the first values with the latest ones', async () => {
    const hba1c = program.items.find((item) => item.variableId === 'hba1c')!
    const weight = program.items.find((item) => item.variableId === 'weight')!
    await recordProgramValues(member, program, 'today', isoDate(Date.now() - 29 * DAY), { [weight.id]: '100' })
    await recordProgramValues(member, program, 'today', isoDate(Date.now()), { [weight.id]: '94' })
    await recordProgramValues(member, program, 'lab', isoDate(Date.now()), { [hba1c.id]: '5.8' })

    const report = (await personalReport(member, program))!
    const status = Object.fromEntries(report.measures.map((measure) => [measure.variableId, measure.status]))
    expect(status).toMatchObject({ weight: 'improved', hba1c: 'improved', 'energy-level': 'waiting', nausea: 'waiting' })
    expect(report.verdict).toBe('2 of 2 measures improved. 2 still need a second value.')
    expect(await personalReport(other, program)).toBeNull()
  })
})

describe('company totals', () => {
  it('are for the instance owner only', async () => {
    await expect(programDashboard(other.id, program)).rejects.toThrow('Only the owner')
  })

  it('hide a measure until enough people have values at both times', async () => {
    const dashboard = await programDashboard(owner.id, program)
    expect(dashboard.enrolled).toBe(1)
    expect(dashboard.totals.find((measure) => measure.variableId === 'weight')).toMatchObject({ people: 1, hidden: true, improved: 0 })
  })

  it(`show counts once ${MIN_GROUP_SIZE} people have values at both times`, async () => {
    const weight = program.items.find((item) => item.variableId === 'weight')!
    for (let index = 0; index < MIN_GROUP_SIZE - 1; index++) {
      const person = await newUser(`cohort-${index}`)
      await joinProgram(person, program)
      await adminDb.program_enrollments.updateMany({
        where: { program_id: program.id, user_id: person.id },
        data: { started_at: new Date(Date.now() - 30 * DAY) },
      })
      await recordProgramValues(person, program, 'today', isoDate(Date.now() - 29 * DAY), { [weight.id]: '90' })
      await recordProgramValues(person, program, 'today', isoDate(Date.now()), { [weight.id]: index === 0 ? '95' : '85' })
    }
    const dashboard = await programDashboard(owner.id, program)
    expect(dashboard.enrolled).toBe(MIN_GROUP_SIZE)
    expect(dashboard.totals.find((measure) => measure.variableId === 'weight')).toMatchObject({
      people: MIN_GROUP_SIZE,
      hidden: false,
      improved: MIN_GROUP_SIZE - 1,
      worse: 1,
    })
  })

  it('stop counting a member who leaves', async () => {
    expect(await leaveProgram(member, program.id)).toBe(true)
    expect((await programDashboard(owner.id, program)).enrolled).toBe(MIN_GROUP_SIZE - 1)
  })
})
