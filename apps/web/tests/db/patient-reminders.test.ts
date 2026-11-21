import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, withUserTransaction } from '@/lib/db'
import { deleteReminders, loadMyVariables, loadReminderVariable, saveReminderSettings } from '@/lib/patient/reminders'
import { timeOfDayToString } from '@/lib/time-of-day'
import { recordMeasurement } from '@/lib/tracking/measurements'
import { upsertReminder } from '@/lib/tracking/reminders'

// The patient app's reminder form and My Variables (lib/patient/reminders),
// as the signed-in person with row-level security. See `pnpm test:db`.

const stamp = Date.now()
const userIds: string[] = []

async function person(name: string) {
  const id = await ensurePasswordUser(`patient-reminders-${name}-${stamp}@example.com`, name, 'correct horse battery staple')
  userIds.push(id)
  await adminDb.profiles.update({ where: { id }, data: { timezone: 'America/Chicago' } })
  return id
}

const as = <T>(userId: string, fn: Parameters<typeof withUserTransaction<T>>[1]) => withUserTransaction({ id: userId }, fn)

async function schedules(userId: string, globalVariableId: string) {
  const rows = await adminDb.reminder_schedules.findMany({
    where: { user_id: userId, user_variables: { global_variable_id: globalVariableId } },
    select: { id: true, time_of_day: true, rrule: true, default_value: true, is_active: true, start_date: true },
    orderBy: { created_at: 'asc' },
  })
  return rows.map((row) => ({ ...row, time: timeOfDayToString(row.time_of_day).slice(0, 5) }))
}

const base = { defaultValue: null, isActive: true, startDate: null, endDate: null }

beforeAll(async () => {
  await adminDb.$connect()
})

afterAll(async () => {
  await adminDb.measurements.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('saveReminderSettings', () => {
  it('saves a time of day for each reminder, changing existing schedules first and deleting the rest', async () => {
    const userId = await person('frequencies')
    await as(userId, (tx) => saveReminderSettings(tx, userId, { ...base, globalVariableId: 'energy-level', frequency: 'every-6-hours', times: ['08:00'], defaultValue: 5 }))
    const sixHourly = await schedules(userId, 'energy-level')
    expect(sixHourly.map((s) => s.time)).toEqual(['08:00', '14:00', '20:00', '02:00'])
    expect(sixHourly.every((s) => s.default_value === 5 && s.rrule.includes('FREQ=DAILY'))).toBe(true)

    await as(userId, (tx) => saveReminderSettings(tx, userId, { ...base, globalVariableId: 'energy-level', frequency: 'daily', times: ['09:00', '21:00'] }))
    const daily = await schedules(userId, 'energy-level')
    expect(daily.map((s) => s.time)).toEqual(['09:00', '21:00'])
    // The first two schedules are kept, so their answered notifications stay.
    expect(daily.map((s) => s.id)).toEqual(sixHourly.slice(0, 2).map((s) => s.id))

    const loaded = await as(userId, (tx) => loadReminderVariable(tx, userId, { globalVariableId: 'energy-level' }))
    expect(loaded?.settings).toMatchObject({ frequency: 'daily', times: ['09:00', '21:00'], isActive: true })
  })

  it('keeps the start of a weekly reminder when it is saved again, and starts a new time with it', async () => {
    const userId = await person('weekly')
    await as(userId, (tx) =>
      upsertReminder(tx, userId, { globalVariableId: 'aspirin', timeOfDay: '09:00', rrule: 'FREQ=WEEKLY', startDate: '2026-11-02T15:00:00.000Z' }),
    )
    const loaded = await as(userId, (tx) => loadReminderVariable(tx, userId, { globalVariableId: 'aspirin' }))
    expect(loaded?.settings?.frequency).toBe('weekly')
    await as(userId, (tx) =>
      saveReminderSettings(tx, userId, { ...base, globalVariableId: 'aspirin', frequency: 'weekly', times: ['09:00', '18:00'], startDate: '2026-11-02' }),
    )
    const weekly = await schedules(userId, 'aspirin')
    expect(weekly.map((s) => s.start_date.toISOString())).toEqual(['2026-11-02T15:00:00.000Z', '2026-11-02T15:00:00.000Z'])
  })

  it('makes an as-needed variable a favorite without schedules, and deletes the reminders on request', async () => {
    const userId = await person('as-needed')
    await as(userId, (tx) => saveReminderSettings(tx, userId, { ...base, globalVariableId: 'headache', frequency: 'daily', times: ['08:00'] }))
    const { userVariableId } = await as(userId, (tx) =>
      saveReminderSettings(tx, userId, { ...base, globalVariableId: 'headache', frequency: 'as-needed', times: [] }),
    )
    expect(await schedules(userId, 'headache')).toHaveLength(0)
    expect((await adminDb.user_variables.findUniqueOrThrow({ where: { id: userVariableId } })).is_favorite).toBe(true)

    await as(userId, (tx) => deleteReminders(tx, userId, userVariableId))
    expect((await adminDb.user_variables.findUniqueOrThrow({ where: { id: userVariableId } })).is_favorite).toBe(false)
  })
})

describe('loadMyVariables', () => {
  it('puts each variable under as-needed, scheduled or archived, with its reminders in words', async () => {
    const userId = await person('my-variables')
    await as(userId, async (tx) => {
      await saveReminderSettings(tx, userId, { ...base, globalVariableId: 'headache', frequency: 'as-needed', times: [] })
      await saveReminderSettings(tx, userId, { ...base, globalVariableId: 'energy-level', frequency: 'daily', times: ['08:00'] })
      await saveReminderSettings(tx, userId, { ...base, globalVariableId: 'aspirin', frequency: 'daily', times: ['20:00'], isActive: false })
      await recordMeasurement(tx, userId, { globalVariableId: 'body-weight', value: 70 })
    })
    const variables = await as(userId, (tx) => loadMyVariables(tx, userId, {}))
    expect(variables.map((v) => [v.globalVariableId, v.section, v.description])).toEqual([
      ['aspirin', 'scheduled', 'Paused'],
      ['body-weight', 'archived', 'No reminder'],
      ['energy-level', 'scheduled', 'Daily at 8:00 AM'],
      ['headache', 'as-needed', 'As-needed'],
    ])
    const treatments = await as(userId, (tx) => loadMyVariables(tx, userId, { categoryId: 'intake-and-interventions' }))
    expect(treatments.map((v) => v.globalVariableId)).toEqual(['aspirin'])
  })
})
