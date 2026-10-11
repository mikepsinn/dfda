import { adminDb, type Prisma } from '@/lib/db'
import { buildRruleString, computeNextTriggerAt, enqueueScheduleProcessing } from '@/lib/reminders/schedule'
import { timeOfDayFromString, timeOfDayToString } from '@/lib/time-of-day'
import { invalidArgument, notFound } from './errors'
import type { UpsertReminderInput } from './schemas'
import { ensureUserVariable, resolveVariable, type TrackingDb } from './variables'

const reminderSelect = {
  id: true,
  rrule: true,
  time_of_day: true,
  start_date: true,
  end_date: true,
  is_active: true,
  default_value: true,
  next_trigger_at: true,
  user_variable_id: true,
  user_variables: { select: { global_variables: { select: { id: true, name: true } } } },
} as const

type ReminderRow = Prisma.reminder_schedulesGetPayload<{ select: typeof reminderSelect }>

function toReminder(row: ReminderRow) {
  return {
    id: row.id,
    variable: row.user_variables.global_variables,
    timeOfDay: timeOfDayToString(row.time_of_day).slice(0, 5),
    rrule: row.rrule,
    startDate: row.start_date.toISOString(),
    endDate: row.end_date?.toISOString() ?? null,
    isActive: row.is_active,
    defaultValue: row.default_value,
    nextTriggerAt: row.next_trigger_at?.toISOString() ?? null,
  }
}

/** The user's time zone from their profile; reminders fire at local times. */
async function userTimeZone(db: TrackingDb, userId: string) {
  const profile = await db.profiles.findUnique({ where: { id: userId }, select: { timezone: true } })
  return profile?.timezone || 'UTC'
}

export async function listReminders(db: TrackingDb, userId: string, input: { includeInactive?: boolean }) {
  const rows = await db.reminder_schedules.findMany({
    where: { user_id: userId, ...(input.includeInactive ? {} : { is_active: true }) },
    select: reminderSelect,
    orderBy: [{ time_of_day: 'asc' }, { created_at: 'asc' }],
  })
  return { reminders: rows.map(toReminder) }
}

async function findOwnReminder(db: TrackingDb, userId: string, reminderId: string) {
  const row = await db.reminder_schedules.findFirst({ where: { id: reminderId, user_id: userId }, select: reminderSelect })
  if (!row) throw notFound(`No reminder with id "${reminderId}".`)
  return row
}

export async function getReminder(db: TrackingDb, userId: string, reminderId: string) {
  return toReminder(await findOwnReminder(db, userId, reminderId))
}

/** The recurrence rule parts of a stored rule string, without DTSTART and UNTIL. */
function ruleParts(rruleString: string) {
  const line = rruleString.split('\n').find((part) => part.startsWith('RRULE:')) ?? rruleString
  return line
    .replace(/^RRULE:/, '')
    .split(';')
    .filter((part) => !part.startsWith('UNTIL='))
    .join(';')
}

/** Creates a reminder, or changes one when trackingReminderId is given. */
export async function upsertReminder(db: TrackingDb, userId: string, input: UpsertReminderInput) {
  const existing = input.trackingReminderId ? await findOwnReminder(db, userId, input.trackingReminderId) : null
  if (!existing && !input.globalVariableId && !input.variableName) {
    throw invalidArgument('A new reminder needs globalVariableId or variableName.')
  }
  if (!existing && !input.timeOfDay) throw invalidArgument('A new reminder needs timeOfDay, for example 08:00.')

  const userVariableId =
    input.globalVariableId || input.variableName
      ? (await ensureUserVariable(db, userId, (await resolveVariable(db, input)).id)).id
      : existing!.user_variable_id

  const timeZone = await userTimeZone(db, userId)
  const timeOfDay = input.timeOfDay ?? toReminder(existing!).timeOfDay
  const startDate = input.startDate ? new Date(input.startDate) : existing?.start_date ?? new Date()
  const endDate = input.endDate === undefined ? existing?.end_date ?? null : input.endDate ? new Date(input.endDate) : null
  if (endDate && endDate < startDate) throw invalidArgument('endDate is before startDate.')
  const isActive = input.isActive ?? existing?.is_active ?? true

  let rrule: string
  try {
    rrule = buildRruleString(input.rrule ?? (existing ? ruleParts(existing.rrule) : 'FREQ=DAILY'), startDate, timeZone, endDate)
  } catch (error) {
    throw invalidArgument(`The recurrence rule is not valid: ${(error as Error).message}`)
  }

  const data = {
    user_variable_id: userVariableId,
    rrule,
    time_of_day: timeOfDayFromString(timeOfDay),
    start_date: startDate,
    end_date: endDate,
    is_active: isActive,
    default_value: input.defaultValue === undefined ? existing?.default_value ?? null : input.defaultValue,
    next_trigger_at: computeNextTriggerAt({ rruleString: rrule, timeOfDay, startDate, isActive }, timeZone),
    updated_at: new Date(),
  }

  const row = existing
    ? await db.reminder_schedules.update({ where: { id: existing.id }, data, select: reminderSelect })
    : await db.reminder_schedules.create({ data: { ...data, user_id: userId }, select: reminderSelect })
  return { reminder: toReminder(row), created: !existing }
}

/**
 * After a reminder is saved and committed: a changed reminder loses its future
 * pending notifications, and the worker makes the next one from the saved
 * schedule. Users may not delete notifications under row-level security, so
 * this uses the admin client, for a reminder whose owner upsertReminder has
 * checked.
 */
export async function afterReminderSaved(userId: string, reminder: { id: string; isActive: boolean }, created: boolean) {
  if (!created) {
    await adminDb.reminder_notifications.deleteMany({
      where: {
        reminder_schedule_id: reminder.id,
        user_id: userId,
        status: 'pending',
        notification_trigger_at: { gt: new Date() },
      },
    })
  }
  if (reminder.isActive) await enqueueScheduleProcessing(reminder.id)
}

export async function deleteReminder(db: TrackingDb, userId: string, reminderId: string) {
  // Its notifications are deleted with it (foreign key cascade).
  const { count } = await db.reminder_schedules.deleteMany({ where: { id: reminderId, user_id: userId } })
  if (count === 0) throw notFound(`No reminder with id "${reminderId}".`)
  return { id: reminderId, deleted: true }
}
