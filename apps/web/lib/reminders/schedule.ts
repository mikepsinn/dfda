import { RRule, rrulestr } from 'rrule'
import { DateTime } from 'luxon'
import { toZonedTime } from 'date-fns-tz'
import { quickAddJob } from 'graphile-worker'
import { logger } from '@/lib/logger'

/**
 * Reminder schedule helpers shared by the reminder actions and the tracking
 * API, so that both store schedules that the worker (worker/tasks.ts) reads
 * the same way.
 */

/**
 * The next time a schedule fires after now, in UTC, or null when it is
 * inactive or has no later occurrence. `timeOfDay` is 'HH:mm' in `timeZone`.
 */
export function computeNextTriggerAt(
  schedule: { rruleString: string; timeOfDay: string; startDate: Date; isActive: boolean },
  timeZone: string,
): Date | null {
  if (!schedule.isActive) return null
  try {
    const rule = rrulestr(schedule.rruleString) as RRule
    const [hours, minutes] = schedule.timeOfDay.split(':').map(Number)

    // Prefer the rule's own DTSTART; otherwise the schedule's start date.
    const dtstartSource = rule.options.dtstart instanceof Date ? rule.options.dtstart : schedule.startDate
    const dtstartWithTime = new Date(dtstartSource)
    dtstartWithTime.setHours(hours, minutes, 0, 0)

    const calculationRule = new RRule({
      ...rule.options,
      dtstart: toZonedTime(dtstartWithTime, timeZone),
      tzid: timeZone,
    })
    const nextOccurrence = calculationRule.after(toZonedTime(new Date(), timeZone), true)
    if (!nextOccurrence) return null
    const iso = DateTime.fromJSDate(nextOccurrence).setZone(timeZone).toUTC().toISO()
    return iso ? new Date(iso) : null
  } catch (error) {
    logger.error('Error calculating the next reminder time', { rruleString: schedule.rruleString, error })
    return null
  }
}

/**
 * Builds the stored rule string from recurrence rule parts (for example
 * 'FREQ=WEEKLY;BYDAY=MO,TH'), in the same form the reminder editor saves:
 * the start date and time zone in DTSTART, and an optional end in UNTIL.
 * Throws an Error when the parts are not a valid recurrence rule.
 */
export function buildRruleString(parts: string, startDate: Date, timeZone: string, endDate?: Date | null): string {
  const text = parts.trim().replace(/^RRULE:/i, '')
  if (/DTSTART|\n/i.test(text)) throw new Error('Give only the recurrence rule parts, without DTSTART.')
  const options = RRule.parseString(text)
  if (options.freq === undefined) throw new Error('The recurrence rule needs FREQ, for example FREQ=DAILY.')
  return new RRule({
    ...options,
    dtstart: startDate,
    tzid: timeZone,
    ...(endDate ? { until: endDate } : {}),
  }).toString()
}

/**
 * Whether a schedule fires on `day` (YYYY-MM-DD) in `timeZone`: the day is
 * between its start and end dates there (the end date, or the UNTIL of its
 * rule), and its recurrence rule has an occurrence on the day. The rule is
 * read in local days, so a weekly rule without BYDAY fires on the weekday of
 * the start date.
 */
export function firesOn(
  schedule: { rruleString: string; startDate: Date; endDate: Date | null },
  day: string,
  timeZone: string,
): boolean {
  const localDay = (at: Date) => DateTime.fromJSDate(at).setZone(timeZone).toISODate() ?? ''
  if (day < localDay(schedule.startDate) || (schedule.endDate && day > localDay(schedule.endDate))) return false
  try {
    const options = (rrulestr(schedule.rruleString) as RRule).origOptions
    // A rule from the tracking API can end with UNTIL and have no end date.
    if (options.until && day > localDay(options.until)) return false
    // Days as UTC midnights: the occurrences are local days, without time zone shifts.
    // The start and the zone come from the schedule; the end is checked above.
    const midnight = (isoDay: string) => new Date(`${isoDay}T00:00:00.000Z`)
    const rule = new RRule({ ...options, dtstart: midnight(localDay(schedule.startDate)), until: null, tzid: null })
    const from = midnight(day)
    return rule.between(from, new Date(from.getTime() + 86_400_000 - 1), true).length > 0
  } catch (error) {
    logger.error('Error reading the recurrence rule of a reminder', { rruleString: schedule.rruleString, error })
    return false
  }
}

/**
 * Asks the worker to create the first notification of a schedule. A failure
 * is logged and does not fail the caller: the worker's regular run creates
 * notifications for all active schedules.
 */
export async function enqueueScheduleProcessing(scheduleId: string): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    logger.error('DATABASE_URL is not set; cannot enqueue the reminder schedule job', { scheduleId })
    return
  }
  try {
    await quickAddJob({ connectionString }, 'processSingleSchedule', { scheduleId })
  } catch (error) {
    logger.error('Error enqueuing the processSingleSchedule job', {
      scheduleId,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}
