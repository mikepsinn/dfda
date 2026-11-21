import { DateTime } from 'luxon'
import { zoneOf } from '@/lib/reminders/schedule'
import { timeOfDayToString } from '@/lib/time-of-day'
import { invalidArgument } from '@/lib/tracking/errors'
import { deleteReminder, ruleParts, upsertReminder } from '@/lib/tracking/reminders'
import { ensureUserVariable, type TrackingDb } from '@/lib/tracking/variables'
import {
  describeSettings, ruleOf, scheduleTimes, settingsOf, type FrequencyId, type ReminderSettings, type StoredSchedule,
} from './reminder-settings'

/**
 * Server reads and writes for the patient app's reminder form and My
 * Variables (docs/MIGRATION.md, "Patient app modeled on QuantiModo", phase 2),
 * over the tracking layer's reminders, which the MCP server and /api/v1 use.
 * They run in the signed-in person's transaction (withUserTransaction).
 */

const scheduleSelect = {
  id: true,
  rrule: true,
  time_of_day: true,
  is_active: true,
  default_value: true,
  start_date: true,
  end_date: true,
} as const

type ScheduleRow = { id: string; rrule: string; time_of_day: Date; is_active: boolean; default_value: number | null; start_date: Date; end_date: Date | null }

function toStored(row: ScheduleRow): StoredSchedule {
  return {
    rule: ruleParts(row.rrule),
    timeOfDay: timeOfDayToString(row.time_of_day).slice(0, 5),
    isActive: row.is_active,
    defaultValue: row.default_value,
    startDate: row.start_date.toISOString(),
    endDate: row.end_date?.toISOString() ?? null,
  }
}

async function zoneFor(tx: TrackingDb, userId: string) {
  const profile = await tx.profiles.findUnique({ where: { id: userId }, select: { timezone: true } })
  return zoneOf(profile?.timezone)
}

/** What the reminder form needs for one variable. */
export type ReminderVariable = {
  globalVariableId: string
  userVariableId: string | null
  name: string
  emoji: string | null
  category: string
  unit: string
  /** The saved settings, or null when the variable has no reminder yet. */
  settings: ReminderSettings | null
  timezone: string
}

export async function loadReminderVariable(
  tx: TrackingDb,
  userId: string,
  ref: { userVariableId: string } | { globalVariableId: string },
): Promise<ReminderVariable | null> {
  const unit = { select: { abbreviated_name: true } } as const
  const userVariable = await tx.user_variables.findFirst({
    where: { user_id: userId, deleted_at: null, ...('userVariableId' in ref ? { id: ref.userVariableId } : { global_variable_id: ref.globalVariableId }) },
    select: {
      id: true,
      is_favorite: true,
      global_variable_id: true,
      units: unit,
      reminder_schedules: { select: scheduleSelect, orderBy: { created_at: 'asc' } },
    },
  })
  const globalVariableId = userVariable?.global_variable_id ?? ('globalVariableId' in ref ? ref.globalVariableId : null)
  if (!globalVariableId) return null
  const variable = await tx.global_variables.findFirst({
    where: { id: globalVariableId, deleted_at: null },
    select: { id: true, name: true, emoji: true, variable_categories: { select: { name: true } }, units: unit },
  })
  if (!variable) return null
  return {
    globalVariableId: variable.id,
    userVariableId: userVariable?.id ?? null,
    name: variable.name,
    emoji: variable.emoji,
    category: variable.variable_categories.name,
    unit: (userVariable?.units ?? variable.units).abbreviated_name,
    settings: userVariable ? settingsOf(userVariable.reminder_schedules.map(toStored), userVariable.is_favorite) : null,
    timezone: await zoneFor(tx, userId),
  }
}

export type SaveReminderInput = {
  globalVariableId: string
  frequency: FrequencyId | 'custom'
  /** HH:mm: the first time for a frequency of every few hours, else each time; for a custom schedule, one per schedule. */
  times: string[]
  defaultValue: number | null
  isActive: boolean
  /** Local dates (YYYY-MM-DD) in the person's time zone, or null. */
  startDate: string | null
  endDate: string | null
}

/** A saved schedule, for afterReminderSaved once the transaction has committed. */
export type SavedSchedule = { id: string; isActive: boolean; created: boolean }

function localDay(day: string, zone: string) {
  const at = DateTime.fromISO(day, { zone })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !at.isValid) throw invalidArgument(`"${day}" is not a date.`)
  return at
}

/**
 * Saves a variable's reminders from the form. As-needed makes the variable a
 * favorite and deletes its schedules. Another frequency saves one schedule
 * per time of day, changing the existing schedules first (so their answered
 * notifications stay) and deleting the ones left over. A custom schedule keeps
 * each schedule's rule and changes the rest.
 */
export async function saveReminderSettings(tx: TrackingDb, userId: string, input: SaveReminderInput) {
  const userVariable = await ensureUserVariable(tx, userId, input.globalVariableId)
  const existing = await tx.reminder_schedules.findMany({
    where: { user_variable_id: userVariable.id, user_id: userId },
    select: { id: true, start_date: true },
    orderBy: { created_at: 'asc' },
  })
  const saved: SavedSchedule[] = []
  if (input.frequency === 'as-needed') {
    for (const schedule of existing) await deleteReminder(tx, userId, schedule.id)
    await tx.user_variables.update({ where: { id: userVariable.id }, data: { is_favorite: true, updated_at: new Date() }, select: { id: true } })
    return { userVariableId: userVariable.id, saved }
  }

  const zone = await zoneFor(tx, userId)
  // The start date stays as it is unless the form changed its day: a weekly reminder fires on the
  // weekday of its start, and one every other day on the days counted from it. So a new schedule
  // beside existing ones starts with them, except a daily one, which starts now. A start date of
  // today also starts now, so that a new reminder is not due at once for a time already past.
  const savedStart = existing[0]?.start_date
  const changedStart =
    input.startDate && (!savedStart || DateTime.fromJSDate(savedStart).setZone(zone).toISODate() !== input.startDate)
      ? DateTime.max(localDay(input.startDate, zone).startOf('day'), DateTime.now()).toUTC().toISO()!
      : undefined
  const endDate = input.endDate ? localDay(input.endDate, zone).endOf('day').toUTC().toISO()! : null
  const common = { isActive: input.isActive, defaultValue: input.defaultValue, endDate }
  const save = async (fields: { trackingReminderId?: string; timeOfDay: string; rrule?: string }) => {
    const { reminder, created } = await upsertReminder(tx, userId, {
      ...common,
      ...fields,
      startDate: changedStart ?? (fields.trackingReminderId || fields.rrule === 'FREQ=DAILY' ? undefined : savedStart?.toISOString()),
      ...(fields.trackingReminderId ? {} : { globalVariableId: input.globalVariableId }),
    })
    saved.push({ id: reminder.id, isActive: reminder.isActive, created })
  }

  if (input.frequency === 'custom') {
    if (input.times.length !== existing.length) throw invalidArgument('Give one time for each reminder.')
    for (const [i, schedule] of existing.entries()) await save({ trackingReminderId: schedule.id, timeOfDay: input.times[i] })
  } else {
    const times = scheduleTimes(input.frequency, input.times)
    if (times.length === 0) throw invalidArgument('Choose a time for the reminder.')
    const rrule = ruleOf(input.frequency)!
    for (const [i, timeOfDay] of times.entries()) await save({ trackingReminderId: existing[i]?.id, timeOfDay, rrule })
    for (const schedule of existing.slice(times.length)) await deleteReminder(tx, userId, schedule.id)
  }
  return { userVariableId: userVariable.id, saved }
}

/** Deletes a variable's reminders and takes it off the favorites; the variable and its measurements stay. */
export async function deleteReminders(tx: TrackingDb, userId: string, userVariableId: string) {
  await tx.reminder_schedules.deleteMany({ where: { user_variable_id: userVariableId, user_id: userId } })
  await tx.user_variables.updateMany({ where: { id: userVariableId, user_id: userId }, data: { is_favorite: false, updated_at: new Date() } })
}

export type MyVariableSection = 'as-needed' | 'scheduled' | 'archived'

export type MyVariable = {
  userVariableId: string
  globalVariableId: string
  name: string
  emoji: string | null
  category: string
  section: MyVariableSection
  /** The reminders in words, for example "Daily at 8:00 AM", or "No reminder". */
  description: string
}

/**
 * The person's variables for My Variables, in QuantiModo's sections:
 * as-needed (favorites without an active reminder), scheduled (with active
 * or paused reminders that have not ended) and archived (the rest: ended
 * reminders, or none). Each section is in name order.
 */
export async function loadMyVariables(tx: TrackingDb, userId: string, input: { categoryId?: string }, now = new Date()): Promise<MyVariable[]> {
  const [rows, zone] = await Promise.all([
    tx.user_variables.findMany({
      where: {
        user_id: userId,
        deleted_at: null,
        global_variables: { deleted_at: null, ...(input.categoryId ? { variable_category_id: input.categoryId } : {}) },
      },
      select: {
        id: true,
        global_variable_id: true,
        is_favorite: true,
        global_variables: { select: { name: true, emoji: true, variable_categories: { select: { name: true } } } },
        reminder_schedules: { select: scheduleSelect, orderBy: { created_at: 'asc' } },
      },
    }),
    zoneFor(tx, userId),
  ])
  return rows
    .map((row): MyVariable => {
      const schedules = row.reminder_schedules.map(toStored)
      const current = schedules.some((s) => s.isActive && !(s.endDate && new Date(s.endDate) < now))
      const settings = settingsOf(schedules, row.is_favorite)
      const section: MyVariableSection = current
        ? 'scheduled'
        : row.is_favorite
          ? 'as-needed'
          : schedules.some((s) => !s.endDate || new Date(s.endDate) >= now) ? 'scheduled' : 'archived'
      return {
        userVariableId: row.id,
        globalVariableId: row.global_variable_id,
        name: row.global_variables.name,
        emoji: row.global_variables.emoji,
        category: row.global_variables.variable_categories.name,
        section,
        description: section === 'as-needed' ? 'As-needed' : settings ? describeSettings(settings, zone, now) : 'No reminder',
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
