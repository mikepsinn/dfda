import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, withUserTransaction } from '@/lib/db'
import { refreshDueNotifications } from '@/lib/reminders/due'
import { recordMeasurement } from '@/lib/tracking/measurements'
import { trackingOperations } from '@/lib/tracking/operations'
import { upsertReminder } from '@/lib/tracking/reminders'

// The due notifications of a person's reminders without the reminder worker
// (lib/reminders/due.ts), and the due list of the MCP server and REST API.
// See `pnpm test:db`.

const stamp = Date.now()
const password = 'correct horse battery staple'
const userIds: string[] = []
// A Tuesday, 10:00 UTC.
const now = new Date('2026-10-20T10:00:00.000Z')

async function person(name: string, timezone: string) {
  const id = await ensurePasswordUser(`due-${name}-${stamp}@example.com`, name, password)
  userIds.push(id)
  await adminDb.profiles.update({ where: { id }, data: { timezone } })
  return id
}

async function reminder(userId: string, globalVariableId: string, timeOfDay: string, rrule = 'FREQ=DAILY', isActive = true) {
  const { reminder } = await withUserTransaction({ id: userId }, (tx) =>
    upsertReminder(tx, userId, { globalVariableId, timeOfDay, rrule, isActive, startDate: '2026-01-01T00:00:00.000Z' }),
  )
  return reminder.id
}

function value(userId: string, globalVariableId: string, startTime: string, amount = 3, unitId?: string) {
  return withUserTransaction({ id: userId }, (tx) => recordMeasurement(tx, userId, { globalVariableId, value: amount, startTime, unitId }))
}

const notifications = (userId: string) =>
  adminDb.reminder_notifications.findMany({
    where: { user_id: userId },
    select: {
      notification_trigger_at: true,
      status: true,
      log_details: true,
      reminder_schedules: { select: { user_variables: { select: { global_variable_id: true } } } },
    },
    orderBy: { notification_trigger_at: 'asc' },
  })

const line = (row: Awaited<ReturnType<typeof notifications>>[number]) =>
  `${row.reminder_schedules.user_variables.global_variable_id} ${row.notification_trigger_at.toISOString()} ${row.status}`
/** One line for each notification, by variable and time. */
const summary = (rows: Awaited<ReturnType<typeof notifications>>) => rows.map(line).sort()

beforeAll(async () => {
  await adminDb.$connect()
})

afterAll(async () => {
  await adminDb.measurements.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('due notifications without the worker', () => {
  it('are made for each time a reminder fired in the last day, once', async () => {
    const userId = await person('fired', 'UTC')
    await reminder(userId, 'headache', '08:00')
    await reminder(userId, 'fatigue', '20:00')
    // Monday at noon: 22 hours before; Monday at 09:00 would be 25 hours before.
    await reminder(userId, 'dizziness', '12:00', 'FREQ=WEEKLY;BYDAY=MO')
    await reminder(userId, 'nausea', '09:00', 'FREQ=WEEKLY;BYDAY=MO')
    await reminder(userId, 'pain', '09:00', 'FREQ=WEEKLY;BYDAY=WE')
    await reminder(userId, 'energy-level', '09:00', 'FREQ=DAILY', false)

    await refreshDueNotifications(userId, now)
    await refreshDueNotifications(userId, now)
    expect(summary(await notifications(userId))).toEqual([
      'dizziness 2026-10-19T12:00:00.000Z pending',
      'fatigue 2026-10-19T20:00:00.000Z pending',
      'headache 2026-10-20T08:00:00.000Z pending',
    ])
  })

  it("use the person's time zone", async () => {
    const userId = await person('zone', 'America/New_York')
    await reminder(userId, 'headache', '20:00')
    // 19:30 in New York: today's 20:00 has not come; yesterday's was at 00:00 UTC.
    await refreshDueNotifications(userId, new Date('2026-10-20T23:30:00.000Z'))
    expect(summary(await notifications(userId))).toEqual(['headache 2026-10-20T00:00:00.000Z pending'])
  })

  it('are closed by a value of their day, one value for one reminder', async () => {
    const userId = await person('answered', 'UTC')
    await reminder(userId, 'headache', '08:00')
    await reminder(userId, 'nausea', '08:00')
    await reminder(userId, 'nausea', '09:00')
    // A value of a whole day (a program's day form) is saved at noon UTC; a value of another day answers nothing.
    const headache = await value(userId, 'headache', '2026-10-20T12:00:00.000Z', 4)
    await value(userId, 'nausea', '2026-10-18T12:00:00.000Z')
    const nausea = await value(userId, 'nausea', '2026-10-20T09:30:00.000Z', 2)

    await refreshDueNotifications(userId, now)
    const rows = await notifications(userId)
    expect(summary(rows)).toEqual([
      'headache 2026-10-20T08:00:00.000Z completed',
      'nausea 2026-10-20T08:00:00.000Z completed',
      'nausea 2026-10-20T09:00:00.000Z pending',
    ])
    const answerOf = (start: string) => rows.find((row) => line(row).startsWith(start))?.log_details
    expect(answerOf('headache 2026-10-20T08:00')).toEqual({ measurementId: headache.id, loggedValue: 4 })
    expect(answerOf('nausea 2026-10-20T08:00')).toEqual({ measurementId: nausea.id, loggedValue: 2 })

    // A second value answers the second reminder; the first value stays the answer of the first.
    await value(userId, 'nausea', '2026-10-20T09:45:00.000Z')
    await refreshDueNotifications(userId, now)
    expect(summary(await notifications(userId)).filter((line) => line.startsWith('nausea'))).toEqual([
      'nausea 2026-10-20T08:00:00.000Z completed',
      'nausea 2026-10-20T09:00:00.000Z completed',
    ])
  })

  it("store the answer in the person's unit: a weight in pounds answers a reminder in kilograms", async () => {
    const userId = await person('units', 'UTC')
    await reminder(userId, 'weight', '08:00')
    const weight = await value(userId, 'weight', '2026-10-20T09:00:00.000Z', 180, 'pound')
    await refreshDueNotifications(userId, now)
    const [row] = await notifications(userId)
    expect(row.status).toBe('completed')
    const answer = row.log_details as { measurementId: string; loggedValue: number }
    expect(answer.measurementId).toBe(weight.id)
    expect(answer.loggedValue).toBeCloseTo(81.65, 2)
  })

  it('are in the due list of the MCP server and the REST API', async () => {
    const userId = await person('api', 'UTC')
    // Midnight UTC has always come in the last day.
    await reminder(userId, 'headache', '00:00')
    const { notifications: due } = (await trackingOperations.listDueTrackingReminders.run(userId, {})) as {
      notifications: { variable: { id: string } }[]
    }
    expect(due.map((notification) => notification.variable.id)).toEqual(['headache'])
  })
})
