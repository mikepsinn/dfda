import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ensurePasswordUser } from '@/lib/auth-users'
import { adminDb, withUserTransaction } from '@/lib/db'
import { loadInbox } from '@/lib/inbox/load'
import { refreshDueNotifications } from '@/lib/reminders/due'
import { recordMeasurement } from '@/lib/tracking/measurements'
import {
  listDueNotifications,
  reopenNotificationsAnsweredBy,
  respondToNotifications,
  snoozeNotifications,
  undoNotifications,
} from '@/lib/tracking/notifications'
import { upsertReminder } from '@/lib/tracking/reminders'

// The patient inbox (lib/inbox, lib/actions/inbox.ts): answers, snooze, undo
// and favorites, as the signed-in person with row-level security. See `pnpm test:db`.

const stamp = Date.now()
const password = 'correct horse battery staple'
const userIds: string[] = []
const HOUR = 3_600_000

async function person(name: string) {
  const id = await ensurePasswordUser(`inbox-${name}-${stamp}@example.com`, name, password)
  userIds.push(id)
  await adminDb.profiles.update({ where: { id }, data: { timezone: 'UTC' } })
  return id
}

const as = <T>(userId: string, fn: Parameters<typeof withUserTransaction<T>>[1]) => withUserTransaction({ id: userId }, fn)

/** A daily reminder at 00:00 UTC, which fired within the last day, and its pending notification. */
async function dueNotification(userId: string, globalVariableId: string, defaultValue?: number) {
  await as(userId, (tx) =>
    upsertReminder(tx, userId, { globalVariableId, timeOfDay: '00:00', rrule: 'FREQ=DAILY', isActive: true, startDate: '2026-01-01T00:00:00.000Z', defaultValue }),
  )
  await refreshDueNotifications(userId)
  const row = await adminDb.reminder_notifications.findFirstOrThrow({
    where: { user_id: userId, status: 'pending', reminder_schedules: { user_variables: { global_variable_id: globalVariableId } } },
    orderBy: { notification_trigger_at: 'desc' },
    select: { id: true },
  })
  return row.id
}

const notification = (id: string) =>
  adminDb.reminder_notifications.findUniqueOrThrow({ where: { id }, select: { status: true, log_details: true, snoozed_until: true } })

beforeAll(async () => {
  await adminDb.$connect()
})

afterAll(async () => {
  await adminDb.measurements.deleteMany({ where: { user_id: { in: userIds } } })
  await adminDb.users.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.profiles.deleteMany({ where: { id: { in: userIds } } })
  await adminDb.$disconnect()
})

describe('inbox snooze', () => {
  it('hides a notification from the inbox and the due lists until the snooze ends', async () => {
    const userId = await person('snooze')
    const id = await dueNotification(userId, 'headache')
    await as(userId, (tx) => snoozeNotifications(tx, userId, { notificationIds: [id], until: new Date(Date.now() + HOUR) }))

    expect((await notification(id)).status).toBe('pending')
    const due = await as(userId, (tx) => listDueNotifications(tx, userId, {}))
    expect(due.notifications.map((n) => n.id)).not.toContain(id)
    expect((await loadInbox(userId)).items.map((item) => item.notificationId)).not.toContain(id)
    // "Skip everything due" leaves it alone.
    await as(userId, (tx) => respondToNotifications(tx, userId, { action: 'skip' }))
    expect((await notification(id)).status).toBe('pending')

    await adminDb.reminder_notifications.update({ where: { id }, data: { snoozed_until: new Date(Date.now() - 1000) } })
    expect((await loadInbox(userId)).items.map((item) => item.notificationId)).toContain(id)
  })
})

describe('inbox answers', () => {
  it("records a tracked value at its notification's time, also for several days answered at once", async () => {
    const userId = await person('answer-times')
    const today = await dueNotification(userId, 'fatigue')
    const { reminder_schedule_id, notification_trigger_at } = await adminDb.reminder_notifications.findUniqueOrThrow({
      where: { id: today },
      select: { reminder_schedule_id: true, notification_trigger_at: true },
    })
    const twoDaysAgo = new Date(notification_trigger_at.getTime() - 48 * HOUR)
    const older = await adminDb.reminder_notifications.create({
      data: { reminder_schedule_id, user_id: userId, notification_trigger_at: twoDaysAgo, status: 'pending' },
      select: { id: true },
    })

    const answered = await as(userId, (tx) => respondToNotifications(tx, userId, { notificationIds: [today, older.id], action: 'track', value: 3 }))
    const measurements = await adminDb.measurements.findMany({
      where: { id: { in: answered.notifications.map((n) => n.measurementId!) } },
      select: { start_at: true },
      orderBy: { start_at: 'asc' },
    })
    expect(measurements.map((m) => m.start_at.toISOString())).toEqual([twoDaysAgo.toISOString(), notification_trigger_at.toISOString()])
  })
})

describe('inbox undo', () => {
  it('puts a tracked notification back to pending and deletes its measurement', async () => {
    const userId = await person('undo-track')
    const id = await dueNotification(userId, 'fatigue')
    const answered = await as(userId, (tx) => respondToNotifications(tx, userId, { notificationIds: [id], action: 'track', value: 4 }))
    const measurementId = answered.notifications[0].measurementId!
    expect((await notification(id)).status).toBe('completed')

    await as(userId, (tx) => undoNotifications(tx, userId, { notificationIds: [id] }))
    expect(await notification(id)).toEqual({ status: 'pending', log_details: null, snoozed_until: null })
    const measurement = await adminDb.measurements.findUniqueOrThrow({ where: { id: measurementId }, select: { deleted_at: true } })
    expect(measurement.deleted_at).not.toBeNull()
  })

  it('puts skipped and snoozed notifications back to pending', async () => {
    const userId = await person('undo-skip')
    const skipped = await dueNotification(userId, 'headache')
    const snoozed = await dueNotification(userId, 'fatigue')
    await as(userId, (tx) => respondToNotifications(tx, userId, { notificationIds: [skipped], action: 'skip' }))
    await as(userId, (tx) => snoozeNotifications(tx, userId, { notificationIds: [snoozed], until: new Date(Date.now() + HOUR) }))

    await as(userId, (tx) => undoNotifications(tx, userId, { notificationIds: [skipped, snoozed] }))
    expect((await notification(skipped)).status).toBe('pending')
    expect((await notification(snoozed)).snoozed_until).toBeNull()
  })

  it("does not let anyone snooze or undo another person's notification", async () => {
    const owner = await person('owner')
    const other = await person('other')
    const id = await dueNotification(owner, 'headache')
    await as(owner, (tx) => respondToNotifications(tx, owner, { notificationIds: [id], action: 'skip' }))

    await expect(as(other, (tx) => undoNotifications(tx, other, { notificationIds: [id] }))).rejects.toThrow(/No notification/)
    await expect(
      as(other, (tx) => snoozeNotifications(tx, other, { notificationIds: [id], until: new Date(Date.now() + HOUR) })),
    ).rejects.toThrow(/No pending notification/)
    expect((await notification(id)).status).toBe('skipped')
  })
})

describe('inbox favorites', () => {
  it('lists favorite variables with their latest values as one-tap buttons', async () => {
    const userId = await person('favorites')
    for (const amount of [70, 71.5, 70]) {
      await as(userId, (tx) => recordMeasurement(tx, userId, { globalVariableId: 'weight', value: amount }))
    }
    const updated = await as(userId, (tx) =>
      tx.user_variables.updateMany({ where: { user_id: userId, global_variable_id: 'weight' }, data: { is_favorite: true } }),
    )
    expect(updated.count).toBe(1)

    const { favorites } = await loadInbox(userId)
    expect(favorites.map((f) => f.globalVariableId)).toEqual(['weight'])
    expect(favorites[0].isFavorite).toBe(true)
    expect(favorites[0].presets).toEqual([70, 71.5])
  })

  it('reopens the reminder that a favorite value answered when the value is undone', async () => {
    const userId = await person('favorite-undo')
    const id = await dueNotification(userId, 'headache')
    // Recorded from the favorites, the value answers the reminder of its day when the inbox refreshes.
    const measurement = await as(userId, (tx) => recordMeasurement(tx, userId, { globalVariableId: 'headache', value: 2 }))
    await refreshDueNotifications(userId)
    expect(await notification(id)).toMatchObject({ status: 'completed', log_details: { measurementId: measurement.id } })

    // Undo, as deleteFavoriteRecordAction does it.
    const reopened = await as(userId, async (tx) => {
      await tx.measurements.updateMany({ where: { id: measurement.id, user_id: userId }, data: { deleted_at: new Date() } })
      return reopenNotificationsAnsweredBy(tx, userId, measurement.id)
    })
    expect(reopened).toBe(1)
    expect(await notification(id)).toEqual({ status: 'pending', log_details: null, snoozed_until: null })
    expect((await loadInbox(userId)).items.map((item) => item.notificationId)).toContain(id)
  })
})
