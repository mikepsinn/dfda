import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, withUserTransaction } from '@/lib/db'
import { loadHistory } from '@/lib/patient/history'
import { findVariables, loadEditableMeasurement, loadRecordingVariable } from '@/lib/patient/variables'
import { recordMeasurement } from '@/lib/tracking/measurements'

// The patient app's variable search, recording form and History (lib/patient),
// as the signed-in person with row-level security. See `pnpm test:db`.

const stamp = Date.now()
const userIds: string[] = []

async function person(name: string) {
  const id = await ensurePasswordUser(`patient-recording-${name}-${stamp}@example.com`, name, 'correct horse battery staple')
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

describe('variable search and recording form', () => {
  it('offers the person\'s own variables first, latest recorded first, then other matches', async () => {
    const userId = await person('search')
    await as(userId, async (tx) => {
      await recordMeasurement(tx, userId, { globalVariableId: 'headache', value: 3, startTime: '2026-11-01T12:00:00.000Z' })
      await recordMeasurement(tx, userId, { globalVariableId: 'energy-level', value: 6, startTime: '2026-11-10T12:00:00.000Z' })
    })
    const own = await as(userId, (tx) => findVariables(tx, userId, {}))
    expect(own.map((v) => v.globalVariableId)).toEqual(['energy-level', 'headache'])
    expect(own[0].recorded).toEqual({ count: 1, latestAt: '2026-11-10T12:00:00.000Z' })

    const matches = await as(userId, (tx) => findVariables(tx, userId, { query: 'ache' }))
    expect(matches[0].globalVariableId).toBe('headache')
    expect(matches.slice(1).every((v) => v.recorded === null)).toBe(true)
  })

  it('shows a measurement in the person\'s time zone and units to change it', async () => {
    const userId = await person('edit')
    const measurement = await as(userId, (tx) =>
      recordMeasurement(tx, userId, { globalVariableId: 'aspirin', value: 325, startTime: '2026-11-10T14:30:00.000Z', note: 'with food' }),
    )
    const loaded = await as(userId, (tx) => loadEditableMeasurement(tx, userId, measurement.id))
    expect(loaded?.measurement).toMatchObject({ value: 325, unitId: 'milligram', date: '2026-11-10', time: '08:30', note: 'with food' })
    expect(loaded?.variable.units.map((u) => u.id)).toContain('gram')

    const variable = await as(userId, (tx) => loadRecordingVariable(tx, userId, 'aspirin'))
    expect(variable?.presets).toEqual([325])
    expect(await as(userId, (tx) => loadRecordingVariable(tx, userId, 'no-such-variable'))).toBeNull()
  })
})

describe('loadHistory', () => {
  it('pages through the measurements newest first, by category or for one variable', async () => {
    const userId = await person('history')
    await as(userId, async (tx) => {
      for (let day = 1; day <= 55; day++) {
        const date = `2026-09-${String((day % 30) + 1).padStart(2, '0')}T12:00:00.000Z`
        await recordMeasurement(tx, userId, { globalVariableId: day % 2 ? 'headache' : 'aspirin', value: day, startTime: date })
      }
    })
    const first = await as(userId, (tx) => loadHistory(tx, userId, {}))
    expect(first.items).toHaveLength(50)
    expect(first.nextCursor).not.toBeNull()
    const second = await as(userId, (tx) => loadHistory(tx, userId, {}, first.nextCursor))
    expect(second.items).toHaveLength(5)
    const all = [...first.items, ...second.items]
    expect(new Set(all.map((item) => item.id)).size).toBe(55)
    expect(all.map((item) => item.startAt)).toEqual([...all.map((item) => item.startAt)].sort().reverse())

    const treatments = await as(userId, (tx) => loadHistory(tx, userId, { categoryId: 'intake-and-interventions' }))
    expect(treatments.items.every((item) => item.globalVariableId === 'aspirin')).toBe(true)
    const headaches = await as(userId, (tx) => loadHistory(tx, userId, { globalVariableId: 'headache' }))
    expect(headaches.items).toHaveLength(28)
  })
})
