import { DateTime } from 'luxon'
import { adminDb } from '@/lib/db'
import { timeOfDayToString } from '@/lib/time-of-day'
import { valueInUnit } from '@/lib/units/convert'
import { firesOn, zoneOf } from './schedule'

/**
 * The due notifications of a person's reminders, without the reminder worker
 * (worker/tasks.ts), which does not run in every deployment. Before the inbox,
 * the tracking API or the MCP server shows what is due, refreshDueNotifications
 * creates a pending notification for each time that a reminder fired in the
 * last day, at its time of day in the person's time zone, and closes the
 * pending notifications that a value of the same day already answers (for
 * example, a dose recorded on a program's page or from a check-in email).
 * Users may not create notifications under row-level security, so this uses
 * the admin client, for a user whom the caller has signed in. Server only.
 */

const HOUR = 3_600_000
const DAY = 24 * HOUR
/** How far back a reminder that fired gets a notification. */
const FIRED_HOURS = 24
/** How far back a pending notification is closed by a value of its day. */
const ANSWER_DAYS = 7

/**
 * The day of a measurement in `zone`. A value of a whole day (a program's day
 * form, a check-in email) is saved at noon UTC of that day
 * (lib/programs/manage.ts dayTime), so its day is the UTC date.
 */
function dayOf(at: Date, zone: string): string {
  if (at.getUTCHours() === 12 && at.getUTCMinutes() === 0 && at.getUTCSeconds() === 0 && at.getUTCMilliseconds() === 0) {
    return at.toISOString().slice(0, 10)
  }
  return DateTime.fromJSDate(at).setZone(zone).toISODate()!
}

/** Creates the notifications of the reminders that fired in the last day, and closes the answered ones. */
export async function refreshDueNotifications(userId: string, now = new Date()): Promise<void> {
  const profile = await adminDb.profiles.findUnique({ where: { id: userId }, select: { timezone: true } })
  if (!profile) return
  const zone = zoneOf(profile.timezone)
  await createFired(userId, zone, now)
  await closeAnswered(userId, zone, now)
}

async function createFired(userId: string, zone: string, now: Date) {
  const schedules = await adminDb.reminder_schedules.findMany({
    where: { user_id: userId, is_active: true, start_date: { lte: now }, user_variables: { deleted_at: null } },
    select: { id: true, rrule: true, time_of_day: true, start_date: true, end_date: true },
  })
  const today = DateTime.fromJSDate(now).setZone(zone)
  const days = [today.minus({ days: 1 }).toISODate()!, today.toISODate()!]
  const fired = schedules.flatMap((schedule) =>
    days
      .filter((day) => firesOn({ rruleString: schedule.rrule, startDate: schedule.start_date, endDate: schedule.end_date }, day, zone))
      .map((day) => DateTime.fromISO(`${day}T${timeOfDayToString(schedule.time_of_day).slice(0, 5)}`, { zone }).toJSDate())
      .filter((at) => at <= now && now.getTime() - at.getTime() < FIRED_HOURS * HOUR && at >= schedule.start_date)
      .map((at) => ({ reminder_schedule_id: schedule.id, user_id: userId, notification_trigger_at: at, status: 'pending' as const })),
  )
  // A notification that exists already, answered or not, stays as it is.
  if (fired.length) await adminDb.reminder_notifications.createMany({ data: fired, skipDuplicates: true })
}

/**
 * Closes each pending notification of the last week that a value of its day
 * answers: a measurement of the reminder's variable on the notification's day
 * that no other notification has as its answer. The earliest notifications of
 * a day get the earliest values, so two values answer two reminders of the
 * same day, and one value answers one. The answer's value is in the person's
 * unit for the variable, as when they answer the reminder (a weight saved in
 * pounds answers a reminder of a weight in kilograms with its kilograms).
 */
async function closeAnswered(userId: string, zone: string, now: Date) {
  const since = new Date(now.getTime() - ANSWER_DAYS * DAY)
  const unit = { select: { id: true, unit_category_id: true, conversion_factor: true, conversion_offset: true } } as const
  const variableOf = {
    reminder_schedules: {
      select: {
        user_variables: {
          select: { global_variable_id: true, units: unit, global_variables: { select: { units: unit, molar_mass: true } } },
        },
      },
    },
  } as const
  const pending = await adminDb.reminder_notifications.findMany({
    where: { user_id: userId, status: 'pending', notification_trigger_at: { gte: since, lte: now } },
    select: { id: true, notification_trigger_at: true, ...variableOf },
    orderBy: { notification_trigger_at: 'asc' },
  })
  if (pending.length === 0) return
  const variableIds = [...new Set(pending.map((row) => row.reminder_schedules.user_variables.global_variable_id))]
  const [measurements, completed] = await Promise.all([
    adminDb.measurements.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        global_variable_id: { in: variableIds },
        // A day in any time zone, and the noon UTC of a day's value, is within a day of its UTC date.
        start_at: { gte: new Date(since.getTime() - DAY), lte: new Date(now.getTime() + DAY) },
      },
      select: { id: true, global_variable_id: true, start_at: true, value: true, units: unit },
      orderBy: { start_at: 'asc' },
    }),
    adminDb.reminder_notifications.findMany({
      where: { user_id: userId, status: 'completed', notification_trigger_at: { gte: new Date(since.getTime() - DAY) } },
      select: { log_details: true },
    }),
  ])
  const used = new Set(
    completed.map((row) => (row.log_details as { measurementId?: unknown } | null)?.measurementId).filter((id) => typeof id === 'string'),
  )
  const free = new Map<string, typeof measurements>()
  for (const measurement of measurements) {
    if (used.has(measurement.id)) continue
    const key = `${measurement.global_variable_id}:${dayOf(measurement.start_at, zone)}`
    free.set(key, [...(free.get(key) ?? []), measurement])
  }
  for (const notification of pending) {
    const variable = notification.reminder_schedules.user_variables
    const day = DateTime.fromJSDate(notification.notification_trigger_at).setZone(zone).toISODate()!
    const measurement = free.get(`${variable.global_variable_id}:${day}`)?.shift()
    if (!measurement) continue
    const value = valueInUnit(measurement.value, measurement.units, variable.units ?? variable.global_variables.units, variable.global_variables.molar_mass)
    if (value === null) continue
    // Only while it is still pending: an answer from the person at the same time wins.
    await adminDb.reminder_notifications.updateMany({
      where: { id: notification.id, status: 'pending' },
      data: {
        status: 'completed',
        completed_or_skipped_at: now,
        log_details: { measurementId: measurement.id, loggedValue: value },
        updated_at: now,
      },
    })
  }
}
