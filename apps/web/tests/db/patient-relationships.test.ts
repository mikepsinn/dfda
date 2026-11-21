import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { analyzeDuePeople, analyzePerson } from '@/lib/analysis/relationships'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, withUserTransaction } from '@/lib/db'
import { deleteMeasurement, recordMeasurement } from '@/lib/tracking/measurements'

// A person's predictor and outcome relationships (lib/analysis/relationships.ts):
// the trigger that marks their analysis due, the job, and who can read and
// write the results. See `pnpm test:db`.

const stamp = Date.now()
const userIds: string[] = []

async function person(name: string) {
  const id = await ensurePasswordUser(`patient-relationships-${name}-${stamp}@example.com`, name, 'correct horse battery staple')
  userIds.push(id)
  await adminDb.profiles.update({ where: { id }, data: { timezone: 'America/Chicago' } })
  return id
}

const as = <T>(userId: string, fn: Parameters<typeof withUserTransaction<T>>[1]) => withUserTransaction({ id: userId }, fn)

/** A seeded random number generator (mulberry32), so the data is the same on every run. */
function random(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const day = (i: number) => new Date(Date.UTC(2026, 8, 1 + i, 15)).toISOString()

/** 60 days of aspirin on some days, and energy 3 points higher on the day after one. */
async function recordAspirinAndEnergy(userId: string) {
  const next = random(11)
  const aspirin = Array.from({ length: 60 }, () => next() < 0.45)
  const ids: string[] = []
  await as(userId, async (tx) => {
    for (let i = 0; i < 60; i++) {
      if (aspirin[i]) ids.push((await recordMeasurement(tx, userId, { globalVariableId: 'aspirin', value: 325, startTime: day(i) })).id)
      if (i > 0) {
        const noise = next() < 0.15 ? (next() < 0.5 ? -1 : 1) : 0
        await recordMeasurement(tx, userId, { globalVariableId: 'energy-level', value: 4 + (aspirin[i - 1] ? 3 : 0) + noise, startTime: day(i) })
      }
    }
  })
  return ids
}

beforeAll(async () => {
  await adminDb.$connect()
})

afterAll(async () => {
  await adminDb.measurements.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('relationship analysis', () => {
  it('marks a person due when they record a measurement, once for a batch, in whole milliseconds', async () => {
    const userId = await person('due')
    expect(await adminDb.relationship_analysis_due.findUnique({ where: { user_id: userId } })).toBeNull()
    await as(userId, async (tx) => {
      await recordMeasurement(tx, userId, { globalVariableId: 'energy-level', value: 5, startTime: day(0) })
      await recordMeasurement(tx, userId, { globalVariableId: 'energy-level', value: 6, startTime: day(1) })
    })
    const due = await adminDb.relationship_analysis_due.findUnique({ where: { user_id: userId } })
    expect(due).not.toBeNull()
    const [{ exact }] = await adminDb.$queryRaw<{ exact: boolean }[]>`
      SELECT due_at = date_trunc('milliseconds', due_at) AS exact FROM relationship_analysis_due WHERE user_id = ${userId}::uuid`
    expect(exact).toBe(true)
  })

  it("finds that energy follows the day's aspirin, stores it for the person only, and drops it when the aspirin is deleted", async () => {
    const userId = await person('aspirin')
    const other = await person('other')
    const aspirinIds = await recordAspirinAndEnergy(userId)

    // First in line, so that other due people in the test database do not matter.
    await adminDb.relationship_analysis_due.update({ where: { user_id: userId }, data: { due_at: new Date('2000-01-01T00:00:00.000Z') } })
    const run = await analyzeDuePeople({ deadline: Date.now() + 60_000, limit: 1 })
    expect(run).toMatchObject({ due: 1, analyzed: 1, failed: 0 })
    expect(await adminDb.relationship_analysis_due.findUnique({ where: { user_id: userId } })).toBeNull()

    const rows = await as(userId, (tx) => tx.user_variable_relationships.findMany({ where: { user_id: userId } }))
    // Energy is the only outcome: aspirin predicting it. Aspirin is not an outcome.
    expect(rows).toHaveLength(1)
    const [row] = rows
    expect(row).toMatchObject({
      predictor_global_variable_id: 'aspirin',
      outcome_global_variable_id: 'energy-level',
      method_version: 'personal-relationship-1',
      onset_delay_days: 1,
      duration_of_action_days: 1,
      predictor_unit_id: 'milligram',
      outcome_unit_id: 'zero-to-ten-scale',
      outcome_measurements: 59,
    })
    expect(row.correlation).toBeGreaterThan(0.8)
    expect(row.p_value).toBeLessThan(0.001)
    expect(row.outcome_with_high_predictor - row.outcome_with_low_predictor).toBeGreaterThan(2.5)
    expect(row.windows_tried).toBe((row.windows as unknown[]).length)
    expect(row.effective_pairs).toBeLessThanOrEqual(row.number_of_pairs)

    // Another person sees nothing, and the person cannot write a result of their own.
    expect(await as(other, (tx) => tx.user_variable_relationships.findMany({ where: { user_id: userId } }))).toEqual([])
    const { id: _id, ...copy } = row
    await expect(as(userId, (tx) => tx.user_variable_relationships.create({
      data: { ...copy, predictor_global_variable_id: 'headache', windows: [] },
    }))).rejects.toThrow(/row-level security/)

    // Deleting the aspirin makes the person due again, and the analysis removes the relationship.
    await as(userId, async (tx) => {
      for (const id of aspirinIds) await deleteMeasurement(tx, userId, id)
    })
    expect(await adminDb.relationship_analysis_due.findUnique({ where: { user_id: userId } })).not.toBeNull()
    expect(await analyzePerson(userId)).toBe(0)
    expect(await adminDb.user_variable_relationships.count({ where: { user_id: userId } })).toBe(0)
  })

  it('lets a person with measurements and results be deleted', async () => {
    const userId = await person('deleted')
    await recordAspirinAndEnergy(userId)
    await analyzePerson(userId)
    expect(await adminDb.user_variable_relationships.count({ where: { user_id: userId } })).toBe(1)
    // Deleting the profile deletes the measurements, which must not mark the deleted person due.
    await adminDb.profiles.delete({ where: { id: userId } })
    expect(await adminDb.relationship_analysis_due.findUnique({ where: { user_id: userId } })).toBeNull()
    expect(await adminDb.user_variable_relationships.count({ where: { user_id: userId } })).toBe(0)
  })

  it('keeps a person due when their measurements change during the analysis', async () => {
    const userId = await person('changed')
    await recordAspirinAndEnergy(userId)
    const seen = new Date('2000-01-01T00:00:00.000Z')
    await adminDb.relationship_analysis_due.update({ where: { user_id: userId }, data: { due_at: seen } })
    await analyzePerson(userId)
    // A measurement recorded meanwhile moves the due time, so removing the row as seen does nothing.
    await as(userId, (tx) => recordMeasurement(tx, userId, { globalVariableId: 'energy-level', value: 5, startTime: day(61) }))
    await adminDb.relationship_analysis_due.deleteMany({ where: { user_id: userId, due_at: seen } })
    expect(await adminDb.relationship_analysis_due.findUnique({ where: { user_id: userId } })).not.toBeNull()
  })
})
