import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, dbAs } from '@/lib/db'
import { PROGRAM_TEMPLATES, programInputSchema } from '@/lib/programs/config'
import { findProgram, personalReport, type Program } from '@/lib/programs/data'
import { joinProgram, recordProgramValues, saveProgram } from '@/lib/programs/manage'
import { preferredUnits, unitChoices } from '@/lib/programs/units'

// The units that a member enters values in (lib/programs/units.ts). See `pnpm test:db`.

const stamp = Date.now()
const slug = `units-${stamp}`
const password = 'correct horse battery staple'
const userIds: string[] = []
let member: { id: string }
let program: Program

const DAY = 86_400_000
const isoDate = (time: number) => new Date(time).toISOString().slice(0, 10)
const glp1 = PROGRAM_TEMPLATES.find((template) => template.key === 'glp-1')!
const item = (variableId: string) => program.items.find((candidate) => candidate.variableId === variableId)!

beforeAll(async () => {
  const owner = { id: await ensurePasswordUser(`units-owner-${stamp}@example.com`, 'Owner', password) }
  member = { id: await ensurePasswordUser(`units-member-${stamp}@example.com`, 'Member', password) }
  userIds.push(owner.id, member.id)
  await dbAs(owner).instances.create({ data: { slug, name: 'Units Clinic', owner_id: owner.id }, select: { id: true } })
  await saveProgram(
    owner,
    slug,
    programInputSchema.parse({ name: 'GLP-1', slug: 'glp-1', summary: '', followUpWeeks: '12', items: JSON.stringify(glp1.items) }),
  )
  program = (await findProgram(slug, 'glp-1'))!
  await joinProgram(member, program, { scheduleNotifications: false })
})

afterAll(async () => {
  await adminDb.measurements.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.instances.deleteMany({ where: { slug } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('the units of a value', () => {
  it('are units of the same kind near the size of the unit: kilograms and pounds, not milligrams', async () => {
    const choices = await unitChoices(program.items)
    expect(choices.get(item('weight').id)?.map((choice) => choice.unit)).toEqual(['kg', 'lb'])
    // Ratings and doses have none.
    expect(choices.has(item('energy-level').id)).toBe(false)
    expect(choices.has(item('semaglutide').id)).toBe(false)
  })

  it("are saved as the member enters them, and the member's report shows the unit they chose", async () => {
    const weight = item('weight')
    await recordProgramValues(member, program, 'today', isoDate(Date.now() - DAY), { [weight.id]: '220' }, { units: { [weight.id]: 'pound' } })
    const saved = await adminDb.measurements.findFirstOrThrow({ where: { user_id: member.id, global_variable_id: 'weight' } })
    expect([saved.value, saved.unit_id]).toEqual([220, 'pound'])

    const choices = await unitChoices(program.items)
    const preferred = await preferredUnits(adminDb, member.id, program.items, choices)
    expect(preferred.get(weight.id)).toEqual({ id: 'pound', unit: 'lb' })
    const row = (await personalReport(member, program))!.measures.find((measure) => measure.variableId === 'weight')!
    expect(row.unit).toBe('lb')
    expect(row.before).toBeCloseTo(220)

    // The program's unit again: no preference, and the report is in kilograms.
    await recordProgramValues(member, program, 'today', isoDate(Date.now()), { [weight.id]: '99' }, { units: { [weight.id]: 'kilogram' } })
    expect((await preferredUnits(adminDb, member.id, program.items, choices)).size).toBe(0)
    const again = (await personalReport(member, program))!.measures.find((measure) => measure.variableId === 'weight')!
    expect(again.unit).toBe('kg')
    // Both values are from the start: 220 lb is 99.79 kg, and the mean with 99 kg is 99.4 kg.
    expect(again.before).toBeCloseTo(99.4, 1)
  })

  it('must be one of the choices', async () => {
    const weight = item('weight')
    await expect(
      recordProgramValues(member, program, 'today', isoDate(Date.now()), { [weight.id]: '80' }, { units: { [weight.id]: 'milligram' } }),
    ).rejects.toThrow('Weight: choose a unit from the list.')
  })
})
