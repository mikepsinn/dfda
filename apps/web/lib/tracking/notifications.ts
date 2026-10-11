import type { Prisma } from '@/lib/db'
import { invalidArgument, notFound } from './errors'
import { recordMeasurement } from './measurements'
import type { ListNotificationsInput, RespondToNotificationInput, RespondToNotificationsInput } from './schemas'
import type { TrackingDb } from './variables'

const notificationSelect = {
  id: true,
  reminder_schedule_id: true,
  notification_trigger_at: true,
  status: true,
  completed_or_skipped_at: true,
  log_details: true,
  reminder_schedules: {
    select: {
      default_value: true,
      user_variables: { select: { global_variables: { select: { id: true, name: true } } } },
    },
  },
} as const

type NotificationRow = Prisma.reminder_notificationsGetPayload<{ select: typeof notificationSelect }>

// An answer stores the measurement id and the value in log_details, as the app does.
function answerDetails(details: Prisma.JsonValue) {
  const value = details && typeof details === 'object' && !Array.isArray(details) ? details : {}
  return {
    measurementId: typeof value.measurementId === 'string' ? value.measurementId : null,
    value: typeof value.loggedValue === 'number' ? value.loggedValue : null,
  }
}

function toNotification(row: NotificationRow) {
  return {
    id: row.id,
    trackingReminderId: row.reminder_schedule_id,
    variable: row.reminder_schedules.user_variables.global_variables,
    triggerAt: row.notification_trigger_at.toISOString(),
    status: row.status,
    defaultValue: row.reminder_schedules.default_value,
    answeredAt: row.completed_or_skipped_at?.toISOString() ?? null,
    ...answerDetails(row.log_details),
  }
}

export async function listNotifications(db: TrackingDb, userId: string, input: ListNotificationsInput) {
  const rows = await db.reminder_notifications.findMany({
    where: {
      user_id: userId,
      ...(input.status ? { status: input.status } : {}),
      notification_trigger_at: {
        ...(input.triggeredAfter ? { gte: new Date(input.triggeredAfter) } : {}),
        ...(input.triggeredBefore ? { lte: new Date(input.triggeredBefore) } : {}),
      },
    },
    select: notificationSelect,
    orderBy: { notification_trigger_at: 'desc' },
    take: input.limit ?? 50,
  })
  return { notifications: rows.map(toNotification) }
}

/** Pending notifications whose time has come, oldest first. */
export async function listDueNotifications(db: TrackingDb, userId: string, input: { limit?: number }) {
  const rows = await db.reminder_notifications.findMany({
    where: { user_id: userId, status: 'pending', notification_trigger_at: { lte: new Date() } },
    select: notificationSelect,
    orderBy: { notification_trigger_at: 'asc' },
    take: input.limit ?? 50,
  })
  return { notifications: rows.map(toNotification) }
}

async function answer(
  tx: TrackingDb,
  userId: string,
  row: NotificationRow,
  input: { action: 'track' | 'skip'; value?: number; note?: string },
) {
  let details: { measurementId: string; loggedValue: number } | null = null
  if (input.action === 'track') {
    const value = input.value ?? row.reminder_schedules.default_value
    if (value === null || value === undefined) {
      throw invalidArgument(`Give a value for "${row.reminder_schedules.user_variables.global_variables.name}": its reminder has no default value.`)
    }
    const measurement = await recordMeasurement(tx, userId, {
      globalVariableId: row.reminder_schedules.user_variables.global_variables.id,
      value,
      note: input.note,
    })
    details = { measurementId: measurement.id, loggedValue: value }
  }
  const updated = await tx.reminder_notifications.update({
    where: { id: row.id },
    data: {
      status: input.action === 'track' ? 'completed' : 'skipped',
      completed_or_skipped_at: new Date(),
      log_details: details ?? undefined,
      updated_at: new Date(),
    },
    select: notificationSelect,
  })
  return toNotification(updated)
}

async function findPending(tx: TrackingDb, userId: string, ids: string[]) {
  const rows = await tx.reminder_notifications.findMany({
    where: { id: { in: ids }, user_id: userId, status: 'pending' },
    select: notificationSelect,
  })
  const missing = ids.filter((id) => !rows.some((row) => row.id === id))
  if (missing.length > 0) throw notFound(`No pending notification with id ${missing.map((id) => `"${id}"`).join(', ')}.`)
  return ids.map((id) => rows.find((row) => row.id === id)!)
}

/** Answers one pending notification. Tracking records the measurement in the same transaction. */
export async function respondToNotification(tx: TrackingDb, userId: string, input: RespondToNotificationInput) {
  const [row] = await findPending(tx, userId, [input.notificationId])
  return { notification: await answer(tx, userId, row, input) }
}

/** Answers several pending notifications (default: all that are due) the same way, all or none. */
export async function respondToNotifications(tx: TrackingDb, userId: string, input: RespondToNotificationsInput) {
  const ids =
    input.notificationIds ??
    (
      await tx.reminder_notifications.findMany({
        where: { user_id: userId, status: 'pending', notification_trigger_at: { lte: new Date() } },
        select: { id: true },
        orderBy: { notification_trigger_at: 'asc' },
        take: 200,
      })
    ).map((row) => row.id)
  const rows = ids.length > 0 ? await findPending(tx, userId, [...new Set(ids)]) : []
  const notifications = []
  for (const row of rows) notifications.push(await answer(tx, userId, row, input))
  return { notifications }
}
