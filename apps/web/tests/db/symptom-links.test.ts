import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, dbAs } from '@/lib/db'
import {
  conditionSymptoms,
  mySymptomRatings,
  symptomOptions,
  trackSymptom,
  treatmentSideEffects,
  unlinkSymptom,
} from '@/lib/programs/side-effects'

// The side effects of a treatment and the symptoms of a condition, as on
// CureTogether: a catalog symptom linked to one of the person's treatments
// (patient_side_effects) or conditions (patient_symptoms), with its ratings as
// measurements (lib/programs/side-effects.ts). See `pnpm test:db`.

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

const stamp = Date.now()
const password = 'correct horse battery staple'
const DAY = 86_400_000
const today = new Date().toISOString().slice(0, 10)
const daysAgo = (days: number) => new Date(Date.now() - days * DAY).toISOString().slice(0, 10)
const userIds: string[] = []
let person: { id: string }
let other: { id: string }

async function treatment(userId: string, treatmentId: string, startDate: Date) {
  const userVariable = await adminDb.user_variables.upsert({
    where: { user_id_global_variable_id: { user_id: userId, global_variable_id: treatmentId } },
    create: { user_id: userId, global_variable_id: treatmentId },
    update: {},
  })
  const row = await adminDb.patient_treatments.create({
    data: { patient_id: userId, treatment_id: treatmentId, user_variable_id: userVariable.id, start_date: startDate },
  })
  return row.id
}

async function condition(userId: string, conditionId: string) {
  const userVariable = await adminDb.user_variables.upsert({
    where: { user_id_global_variable_id: { user_id: userId, global_variable_id: conditionId } },
    create: { user_id: userId, global_variable_id: conditionId },
    update: {},
  })
  const row = await adminDb.patient_conditions.create({
    data: { patient_id: userId, condition_id: conditionId, user_variable_id: userVariable.id },
  })
  return row.id
}

const names = (symptoms: Awaited<ReturnType<typeof treatmentSideEffects>>) =>
  symptoms.map(({ item, ratings }) => [item.name, ratings.map((rating) => rating.value)])

const reminders = (userId: string, variableId: string) =>
  adminDb.reminder_schedules.count({ where: { user_id: userId, user_variables: { global_variable_id: variableId } } })

beforeAll(async () => {
  person = { id: await ensurePasswordUser(`symptom-links-${stamp}@example.com`, 'Person', password) }
  other = { id: await ensurePasswordUser(`symptom-links-other-${stamp}@example.com`, 'Other', password) }
  userIds.push(person.id, other.id)
  await adminDb.profiles.updateMany({ where: { id: { in: userIds } }, data: { timezone: 'UTC' } })
  for (const id of userIds) await adminDb.patients.upsert({ where: { id }, create: { id }, update: {} })
})

afterAll(async () => {
  await adminDb.measurements.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('the symptoms of the catalog', () => {
  it('are the variables that global_symptoms marks, which anyone can read: not diseases or scores', async () => {
    const ids = (await symptomOptions()).map((option) => option.id)
    expect(ids).toEqual(expect.arrayContaining(['headache', 'nausea', 'pain', 'fatigue', 'dizziness']))
    for (const notSymptom of ['copd', 'asthma', 'energy-level', 'side-effects-severity', 'weight']) expect(ids).not.toContain(notSymptom)
    expect(await dbAs(null).global_symptoms.count({ where: { id: 'headache' } })).toBe(1)
  })
})

describe('the side effects of a treatment', () => {
  let metformin: string

  beforeAll(async () => {
    metformin = await treatment(person.id, 'metformin', new Date(`${daysAgo(3)}T15:00:00.000Z`))
  })

  it('link a symptom to the treatment, with a rating and one daily reminder', async () => {
    await trackSymptom(person, { patientTreatmentId: metformin }, { variableId: 'headache', value: '5', date: daysAgo(1) })
    await trackSymptom(person, { patientTreatmentId: metformin }, { variableId: 'headache', value: '3', date: today })
    expect(names(await treatmentSideEffects(person, metformin, new Date(`${daysAgo(3)}T15:00:00.000Z`)))).toEqual([['Headache', [3, 5]]])
    expect(await adminDb.patient_side_effects.count({ where: { patient_treatment_id: metformin } })).toBe(1)
    expect(await reminders(person.id, 'headache')).toBe(1)
  })

  it("count the ratings from the treatment's first day (UTC), and not before", async () => {
    // A rating of a whole day is saved at noon UTC; the treatment started at 15:00 that day.
    await trackSymptom(person, { patientTreatmentId: metformin }, { variableId: 'nausea', value: '2', date: daysAgo(3) })
    await trackSymptom(person, { patientTreatmentId: metformin }, { variableId: 'nausea', value: '6', date: daysAgo(5) })
    const sideEffects = await treatmentSideEffects(person, metformin, new Date(`${daysAgo(3)}T15:00:00.000Z`))
    expect(names(sideEffects)).toEqual([
      ['Headache', [3, 5]],
      ['Nausea', [2]],
    ])
  })

  it('show the other symptoms rated since the start, which the person can add later', async () => {
    const otherTreatment = await treatment(person.id, 'lisinopril', new Date())
    await trackSymptom(person, { patientTreatmentId: otherTreatment }, { variableId: 'dizziness', value: '4', date: today })
    const linked = new Set((await treatmentSideEffects(person, metformin, new Date())).map(({ item }) => item.variableId))
    const others = (await mySymptomRatings(person, new Date(`${daysAgo(3)}T15:00:00.000Z`))).filter(({ item }) => !linked.has(item.variableId))
    expect(others.map(({ item }) => item.name)).toEqual(['Dizziness'])

    // Added without a new rating: one symptom can be a side effect of two treatments.
    await trackSymptom(person, { patientTreatmentId: metformin }, { variableId: 'dizziness', value: '', date: today })
    expect(names(await treatmentSideEffects(person, metformin, new Date(`${daysAgo(3)}T15:00:00.000Z`)))).toEqual([
      ['Dizziness', [4]],
      ['Headache', [3, 5]],
      ['Nausea', [2]],
    ])
    expect(await adminDb.patient_side_effects.count({ where: { symptom_id: 'dizziness', patient_treatments: { patient_id: person.id } } })).toBe(2)
    expect(await reminders(person.id, 'dizziness')).toBe(1)
  })

  it('must be a symptom from the list, on a treatment of the person', async () => {
    for (const variableId of ['copd', 'weight', 'no-such-variable']) {
      await expect(trackSymptom(person, { patientTreatmentId: metformin }, { variableId, value: '', date: today })).rejects.toThrow(
        'Choose a side effect from the list.',
      )
    }
    await expect(trackSymptom(other, { patientTreatmentId: metformin }, { variableId: 'rash', value: '', date: today })).rejects.toThrow(
      'This treatment is not in your list.',
    )
  })

  it('are private: another person sees none of them', async () => {
    expect(await treatmentSideEffects(other, metformin, new Date(0))).toEqual([])
    expect(await dbAs(other).patient_side_effects.count({ where: { patient_treatment_id: metformin } })).toBe(0)
    expect(await unlinkSymptom(other, { patientTreatmentId: metformin }, 'headache')).toBe(false)
  })

  it('are removed without their ratings and their reminder', async () => {
    expect(await unlinkSymptom(person, { patientTreatmentId: metformin }, 'headache')).toBe(true)
    expect(names(await treatmentSideEffects(person, metformin, new Date(0))).map(([name]) => name)).toEqual(['Dizziness', 'Nausea'])
    expect(await adminDb.measurements.count({ where: { user_id: person.id, global_variable_id: 'headache' } })).toBe(2)
    expect(await reminders(person.id, 'headache')).toBe(1)
  })
})

describe('the symptoms of a condition', () => {
  let diabetes: string
  let hypertension: string

  beforeAll(async () => {
    diabetes = await condition(person.id, 'type-2-diabetes')
    hypertension = await condition(person.id, 'hypertension')
  })

  it('link a symptom to the condition, with its ratings; one symptom can belong to two conditions', async () => {
    await trackSymptom(person, { patientConditionId: diabetes }, { variableId: 'fatigue', value: '6', date: today })
    await trackSymptom(person, { patientConditionId: hypertension }, { variableId: 'fatigue', value: '', date: today })
    await trackSymptom(person, { patientConditionId: hypertension }, { variableId: 'headache', value: '', date: today })
    expect(names(await conditionSymptoms(person, diabetes))).toEqual([['Fatigue', [6]]])
    // All the ratings of a symptom, also those from before the link.
    expect(names(await conditionSymptoms(person, hypertension))).toEqual([
      ['Fatigue', [6]],
      ['Headache', [3, 5]],
    ])
    expect(await reminders(person.id, 'fatigue')).toBe(1)
  })

  it('must be a symptom from the list, on a condition of the person, and are private', async () => {
    await expect(trackSymptom(person, { patientConditionId: diabetes }, { variableId: 'copd', value: '', date: today })).rejects.toThrow(
      'Choose a symptom from the list.',
    )
    await expect(trackSymptom(other, { patientConditionId: diabetes }, { variableId: 'rash', value: '', date: today })).rejects.toThrow(
      'This condition is not in your list.',
    )
    expect(await conditionSymptoms(other, diabetes)).toEqual([])
    expect(await dbAs(other).patient_symptoms.count({ where: { patient_condition_id: diabetes } })).toBe(0)
  })

  it('are removed without their ratings', async () => {
    expect(await unlinkSymptom(person, { patientConditionId: hypertension }, 'fatigue')).toBe(true)
    expect(names(await conditionSymptoms(person, hypertension)).map(([name]) => name)).toEqual(['Headache'])
    expect(names(await conditionSymptoms(person, diabetes)).map(([name]) => name)).toEqual(['Fatigue'])
    expect(await adminDb.measurements.count({ where: { user_id: person.id, global_variable_id: 'fatigue' } })).toBe(1)
  })
})
