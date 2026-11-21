import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, withUserTransaction } from '@/lib/db'
import { loadVariablePage } from '@/lib/patient/variable-page'
import { recordMeasurement } from '@/lib/tracking/measurements'
import { upsertReminder } from '@/lib/tracking/reminders'

// The patient app's variable page (lib/patient/variable-page.ts), as the
// signed-in person with row-level security. See `pnpm test:db`.

const stamp = Date.now()
const userIds: string[] = []

async function person(name: string) {
  const id = await ensurePasswordUser(`patient-variable-page-${name}-${stamp}@example.com`, name, 'correct horse battery staple')
  userIds.push(id)
  await adminDb.profiles.update({ where: { id }, data: { timezone: 'America/Chicago' } })
  return id
}

const as = <T>(userId: string, fn: Parameters<typeof withUserTransaction<T>>[1]) => withUserTransaction({ id: userId }, fn)

beforeAll(async () => {
  await adminDb.$connect()
})

afterAll(async () => {
  await adminDb.measurements.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('loadVariablePage', () => {
  const now = new Date('2026-11-21T18:00:00.000Z')

  it('sums a dose in its own unit each local day, counts the days between as zero, and keeps to the period', async () => {
    const userId = await person('dose')
    await as(userId, async (tx) => {
      // 325 mg and 0.5 g on Nov 18 in Chicago (the second is 00:30 UTC on the 19th), then 325 mg on Nov 20.
      await recordMeasurement(tx, userId, { globalVariableId: 'aspirin', value: 325, startTime: '2026-11-18T15:00:00.000Z' })
      await recordMeasurement(tx, userId, { globalVariableId: 'aspirin', value: 0.5, unitAbbreviation: 'g', startTime: '2026-11-19T00:30:00.000Z' })
      await recordMeasurement(tx, userId, { globalVariableId: 'aspirin', value: 325, startTime: '2026-11-20T15:00:00.000Z' })
      // Outside the last 30 days.
      await recordMeasurement(tx, userId, { globalVariableId: 'aspirin', value: 81, startTime: '2026-09-01T15:00:00.000Z' })
      await upsertReminder(tx, userId, { globalVariableId: 'aspirin', timeOfDay: '08:00' })
    })
    const page = await as(userId, (tx) => loadVariablePage(tx, userId, { globalVariableId: 'aspirin' }, '30d', now))
    expect(page?.rules).toEqual({ combination: 'SUM', fillingType: 'zero' })
    expect(page?.unit.abbreviatedName).toBe('mg')
    expect(page?.daily).toEqual([
      { day: '2026-11-18', value: 825, filled: false },
      { day: '2026-11-19', value: 0, filled: true },
      { day: '2026-11-20', value: 325, filled: false },
    ])
    expect(page).toMatchObject({ measurementCount: 3, hasReminder: true, allTime: { count: 4, firstAt: '2026-09-01T15:00:00.000Z' } })
    expect(page?.stats).toMatchObject({ days: 3, maximum: 825, minimum: 0 })

    const all = await as(userId, (tx) => loadVariablePage(tx, userId, { userVariableId: page!.userVariableId }, 'all', now))
    expect(all?.measurementCount).toBe(4)
  })

  it('averages a rating and leaves out days without one, and is null for a variable the person does not have', async () => {
    const userId = await person('rating')
    await as(userId, async (tx) => {
      await recordMeasurement(tx, userId, { globalVariableId: 'energy-level', value: 4, startTime: '2026-11-16T14:00:00.000Z' })
      await recordMeasurement(tx, userId, { globalVariableId: 'energy-level', value: 8, startTime: '2026-11-16T22:00:00.000Z' })
      await recordMeasurement(tx, userId, { globalVariableId: 'energy-level', value: 5, startTime: '2026-11-19T14:00:00.000Z' })
    })
    const page = await as(userId, (tx) => loadVariablePage(tx, userId, { globalVariableId: 'energy-level' }, '90d', now))
    expect(page?.daily.map((d) => [d.day, d.value])).toEqual([['2026-11-16', 6], ['2026-11-19', 5]])
    expect(page?.weekdays.find((w) => w.weekday === 'Mon')).toEqual({ weekday: 'Mon', average: 6, days: 1 })
    expect(page?.hasReminder).toBe(false)
    expect(await as(userId, (tx) => loadVariablePage(tx, userId, { globalVariableId: 'aspirin' }, '90d', now))).toBeNull()
  })
})
