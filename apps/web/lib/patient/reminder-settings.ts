import { DateTime } from 'luxon'

/**
 * A variable's reminders as QuantiModo's reminder form shows them: one
 * frequency and up to three times of day (docs/MIGRATION.md, "Patient app
 * modeled on QuantiModo", phase 2). Here each time is its own reminder
 * schedule with a recurrence rule, which the reminder worker and the inbox read
 * (lib/reminders). A frequency of every few hours is stored as several daily
 * times: every 8 hours from 8:00 is daily at 8:00, 16:00 and 0:00. Pure, so
 * the form and the server share it.
 */

export const FREQUENCIES = [
  // Daily comes first, as in QuantiModo, where it is the default.
  { id: 'daily', label: 'Daily', rule: 'FREQ=DAILY' },
  { id: 'as-needed', label: 'As-needed' },
  { id: 'every-12-hours', label: 'Every 12 hours', everyMinutes: 720 },
  { id: 'every-8-hours', label: 'Every 8 hours', everyMinutes: 480 },
  { id: 'every-6-hours', label: 'Every 6 hours', everyMinutes: 360 },
  { id: 'every-4-hours', label: 'Every 4 hours', everyMinutes: 240 },
  { id: 'every-3-hours', label: 'Every 3 hours', everyMinutes: 180 },
  { id: 'every-2-hours', label: 'Every 2 hours', everyMinutes: 120 },
  { id: 'hourly', label: 'Hourly', everyMinutes: 60 },
  { id: 'every-30-minutes', label: 'Every 30 minutes', everyMinutes: 30 },
  { id: 'every-other-day', label: 'Every other day', rule: 'FREQ=DAILY;INTERVAL=2' },
  { id: 'weekly', label: 'Weekly', rule: 'FREQ=WEEKLY' },
  { id: 'every-2-weeks', label: 'Every 2 weeks', rule: 'FREQ=WEEKLY;INTERVAL=2' },
  { id: 'every-4-weeks', label: 'Every 4 weeks', rule: 'FREQ=WEEKLY;INTERVAL=4' },
] as const

type Frequency = (typeof FREQUENCIES)[number]
export type FrequencyId = Frequency['id']

/** At most this many times of day, as QuantiModo's first, second and third reminder times. */
export const MAX_TIMES = 3

const MINUTES_PER_DAY = 1440

export function frequencyOf(id: FrequencyId): Frequency {
  return FREQUENCIES.find((frequency) => frequency.id === id)!
}

export function isFrequencyId(value: string): value is FrequencyId {
  return FREQUENCIES.some((frequency) => frequency.id === value)
}

/** Whether a frequency takes several times of day (daily, weekly) rather than one start time (every few hours). */
export function takesTimes(id: FrequencyId): boolean {
  return 'rule' in frequencyOf(id)
}

const minutesOf = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5))
const timeOf = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

/** The recurrence rule of each of a frequency's schedules. */
export function ruleOf(id: FrequencyId): string | null {
  const frequency = frequencyOf(id)
  if ('rule' in frequency) return frequency.rule
  return 'everyMinutes' in frequency ? 'FREQ=DAILY' : null
}

/**
 * The times of day (HH:mm) of a frequency's schedules: none when as-needed;
 * the given times, without repeats and at most MAX_TIMES; or, every few hours,
 * the first time and each step after it through the day.
 */
export function scheduleTimes(id: FrequencyId, times: string[]): string[] {
  const frequency = frequencyOf(id)
  const valid = times.filter((time) => /^([01]\d|2[0-3]):[0-5]\d$/.test(time))
  if ('everyMinutes' in frequency) {
    if (valid.length === 0) return []
    const first = minutesOf(valid[0])
    return Array.from({ length: MINUTES_PER_DAY / frequency.everyMinutes }, (_, step) =>
      timeOf((first + step * frequency.everyMinutes) % MINUTES_PER_DAY),
    )
  }
  if (!('rule' in frequency)) return []
  return [...new Set(valid)].slice(0, MAX_TIMES)
}

/** A rule's parts in one order, without the default INTERVAL=1, so that equal rules compare equal. */
export function normalRule(parts: string): string {
  return parts
    .toUpperCase()
    .split(';')
    .map((part) => part.trim())
    .filter((part) => part && part !== 'INTERVAL=1')
    .sort((a, b) => (a.startsWith('FREQ=') ? -1 : b.startsWith('FREQ=') ? 1 : a.localeCompare(b)))
    .join(';')
}

export type StoredSchedule = {
  /** The rule's parts, without DTSTART and UNTIL (ruleParts in lib/tracking/reminders). */
  rule: string
  timeOfDay: string
  isActive: boolean
  defaultValue: number | null
  startDate: string
  endDate: string | null
}

export type ReminderSettings = {
  /** 'custom' when the schedules were made elsewhere (the API, the older editor) and fit no frequency here. */
  frequency: FrequencyId | 'custom'
  /** The first time for a frequency of every few hours; else each schedule's time. */
  times: string[]
  isActive: boolean
  defaultValue: number | null
  startDate: string | null
  endDate: string | null
  /**
   * Which of the above differ between the schedules (made elsewhere): the form then
   * leaves each schedule's own value as it is unless the person changes it.
   */
  varies: { isActive: boolean; defaultValue: boolean; endDate: boolean }
}

const NO_VARIES = { isActive: false, defaultValue: false, endDate: false }

/**
 * The settings that a variable's schedules (oldest first) were saved from:
 * as-needed for a favorite without schedules, else the frequency whose rule
 * and times they have. Two or three daily times read as daily, also when they
 * are evenly spaced, as every 12 or 8 hours would be; the reminders are the same.
 * Null when there is no reminder.
 */
export function settingsOf(schedules: StoredSchedule[], isFavorite: boolean): ReminderSettings | null {
  if (schedules.length === 0) {
    return isFavorite
      ? { frequency: 'as-needed', times: [], isActive: true, defaultValue: null, startDate: null, endDate: null, varies: NO_VARIES }
      : null
  }
  const [first] = schedules
  const common = {
    isActive: schedules.some((schedule) => schedule.isActive),
    defaultValue: first.defaultValue,
    startDate: first.startDate,
    endDate: first.endDate,
    varies: {
      isActive: schedules.some((schedule) => schedule.isActive !== first.isActive),
      defaultValue: schedules.some((schedule) => schedule.defaultValue !== first.defaultValue),
      endDate: schedules.some((schedule) => schedule.endDate !== first.endDate),
    },
  }
  const times = schedules.map((schedule) => schedule.timeOfDay)
  const rules = new Set(schedules.map((schedule) => normalRule(schedule.rule)))
  const rule = rules.size === 1 ? [...rules][0] : null
  const withTimes = FREQUENCIES.find((frequency) => 'rule' in frequency && normalRule(frequency.rule) === rule)
  if (withTimes && times.length <= MAX_TIMES && new Set(times).size === times.length) {
    return { frequency: withTimes.id, times, ...common }
  }
  if (rule === 'FREQ=DAILY') {
    const everyFew = FREQUENCIES.find(
      (frequency) => 'everyMinutes' in frequency && MINUTES_PER_DAY / frequency.everyMinutes === times.length,
    )
    if (everyFew && scheduleTimes(everyFew.id, [times[0]]).join() === times.join()) {
      return { frequency: everyFew.id, times: [times[0]], ...common }
    }
  }
  return { frequency: 'custom', times, ...common }
}

/** A time of day (HH:mm) as on the clock, for example 8:00 AM. */
export function clockTime(time: string): string {
  return DateTime.fromFormat(time, 'HH:mm').toFormat('h:mm a')
}

function list(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/**
 * The settings in words, as QuantiModo's reminder list showed them: "Daily at
 * 8:00 AM", "Every 4 hours from 8:00 AM", "Weekly on Monday at 9:00 AM",
 * "Paused", or "Ended Mar 3, 2026". `zone` and `now` place the start and end dates.
 */
export function describeSettings(settings: ReminderSettings, zone: string, now: Date = new Date()): string {
  if (settings.frequency === 'as-needed') return 'As-needed'
  if (settings.endDate && new Date(settings.endDate) < now) {
    return `Ended ${DateTime.fromISO(settings.endDate).setZone(zone).toFormat('MMM d, yyyy')}`
  }
  if (!settings.isActive) return 'Paused'
  const times = list(settings.times.map(clockTime))
  if (settings.frequency === 'custom') return `Custom schedule at ${times}`
  const frequency = frequencyOf(settings.frequency)
  if ('everyMinutes' in frequency) return `${frequency.label} from ${times}`
  const weekly = 'rule' in frequency && frequency.rule.startsWith('FREQ=WEEKLY') && settings.startDate
  const day = weekly ? ` on ${DateTime.fromISO(settings.startDate!).setZone(zone).toFormat('cccc')}` : ''
  return `${frequency.label}${day} at ${times}`
}

/** Days between the repeats of a rule's start: a daily rule's interval, seven times a weekly one's, else null. */
function cycleDays(rule: string): number | null {
  const parts = new Map(normalRule(rule).split(';').map((part) => part.split('=') as [string, string]))
  const interval = Number(parts.get('INTERVAL') ?? 1)
  if (!Number.isInteger(interval) || interval < 1) return null
  if (parts.get('FREQ') === 'DAILY') return interval
  if (parts.get('FREQ') === 'WEEKLY') return 7 * interval
  return null
}

/**
 * The start of a schedule whose recurrence is anchored on `day` (YYYY-MM-DD in
 * `zone`). A weekly reminder fires on the weekday of its start, and one every
 * other day on the days counted from it (firesOn in lib/reminders/schedule.ts),
 * so a past day moves forward by whole cycles of the rule to the first day that
 * is not past, and that day starts no earlier than now: the rule keeps its days,
 * and no reminder is due at once for a time already past. A rule of another
 * frequency keeps the day itself.
 */
export function anchoredStart(day: string, rule: string, zone: string, now: Date = new Date()): Date {
  const anchor = DateTime.fromISO(day, { zone }).startOf('day')
  const today = DateTime.fromJSDate(now).setZone(zone).startOf('day')
  if (anchor >= today) return DateTime.max(anchor, DateTime.fromJSDate(now)).toJSDate()
  const cycle = cycleDays(rule)
  if (cycle === null) return anchor.toJSDate()
  const cycles = Math.ceil(Math.round(today.diff(anchor, 'days').days) / cycle)
  return DateTime.max(anchor.plus({ days: cycles * cycle }), DateTime.fromJSDate(now)).toJSDate()
}
