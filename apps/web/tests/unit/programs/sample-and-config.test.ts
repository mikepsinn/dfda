// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { PROGRAM_TEMPLATES, programInputSchema, usableTemplate, type VariableOption } from '@/lib/programs/config'
import { MIN_GROUP_SIZE, type ReportItem } from '@/lib/programs/report'
import { SAMPLE_SIZE, sampleCohort, sampleView } from '@/lib/programs/sample'

const glp1 = PROGRAM_TEMPLATES.find((template) => template.key === 'glp-1')!
const units: Record<string, string> = {
  semaglutide: 'milligram',
  weight: 'kilogram',
  'energy-level': 'zero-to-ten-scale',
  nausea: 'zero-to-ten-scale',
  hba1c: 'percent',
  'alanine-aminotransferase': 'units-per-liter',
  'apolipoprotein-b': 'milligrams-per-deciliter',
  ferritin: 'nanograms-per-milliliter',
}
const program = {
  id: '6f0c2d7e-0000-4000-8000-000000000001',
  followUpWeeks: glp1.followUpWeeks,
  items: glp1.items.map((item) => ({
    variableId: item.variableId,
    unitId: units[item.variableId],
    kind: item.kind,
    frequency: item.kind === 'lab' ? null : item.frequency,
  })),
}
const items: ReportItem[] = glp1.items.flatMap((item) =>
  item.kind === 'dose'
    ? []
    : [{ variableId: item.variableId, name: item.variableId, unitId: units[item.variableId], unit: '', kind: item.kind, better: item.better }],
)
const now = new Date('2026-10-11T08:00:00Z')

describe('sample data', () => {
  it('makes the same people for the same program', () => {
    const first = sampleCohort({ seedKey: program.id, items: program.items, followUpWeeks: 12, now })
    const again = sampleCohort({ seedKey: program.id, items: program.items, followUpWeeks: 12, now })
    expect(first).toHaveLength(SAMPLE_SIZE)
    expect(again).toEqual(first)
    expect(sampleCohort({ seedKey: 'another program', items: program.items, followUpWeeks: 12, now })).not.toEqual(first)
  })

  it('keeps ratings on their scale and gives labs one value at each time', () => {
    const people = sampleCohort({ seedKey: program.id, items: program.items, followUpWeeks: 12, now })
    const ratings = people.flatMap((person) => person.series.get('energy-level')!.map((point) => point.value))
    expect(Math.min(...ratings)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...ratings)).toBeLessThanOrEqual(10)
    expect(people[0].series.get('hba1c')).toHaveLength(2)
    expect(people[0].series.has('semaglutide')).toBe(false)
  })

  it('shows totals for every measure, and a finished example report', () => {
    const view = sampleView(program, items, now)
    expect(view.enrolled).toBe(SAMPLE_SIZE)
    expect(view.totals.every((measure) => !measure.hidden && measure.people >= MIN_GROUP_SIZE)).toBe(true)
    expect(view.example.measures.every((measure) => measure.status !== 'waiting')).toBe(true)
  })
})

describe('program input', () => {
  const form = (change: Record<string, unknown> = {}) => ({
    name: glp1.name,
    slug: 'GLP-1',
    summary: '',
    followUpWeeks: '12',
    items: JSON.stringify(glp1.items),
    ...change,
  })

  it('accepts a template as the form sends it', () => {
    expect(programInputSchema.parse(form())).toMatchObject({ slug: 'glp-1', summary: null, followUpWeeks: 12, items: glp1.items })
  })

  it.each([
    ['the same variable twice', { items: JSON.stringify([glp1.items[1], glp1.items[1]]) }, 'Each variable can appear only once.'],
    ['doses only', { items: JSON.stringify([glp1.items[0]]) }, 'Add at least one check-in or lab, so the report has something to compare.'],
    ['an item without a variable', { items: JSON.stringify([{ ...glp1.items[1], variableId: '' }]) }, 'Choose a variable from the list.'],
    ['broken JSON', { items: '[' }, 'The list of things to track is not valid.'],
    ['a follow-up of 1 week', { followUpWeeks: '1' }, 'Use 2 to 52 weeks.'],
  ])('refuses %s', (_case, change, message) => {
    const result = programInputSchema.safeParse(form(change))
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain(message)
  })

  it('drops template items whose variables this database does not have', () => {
    const known: VariableOption[] = [{ id: 'weight', name: 'Weight', unit: 'kg', category: 'Health' }]
    expect(usableTemplate(glp1, known).items.map((item) => item.variableId)).toEqual(['weight'])
  })
})
