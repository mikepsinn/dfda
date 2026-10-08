/**
 * Conversions for PostgreSQL TIME columns (such as reminder_schedules.time_of_day).
 *
 * Prisma represents a TIME value as a Date on 1970-01-01 UTC. The app works
 * with 'HH:MM:SS' strings, so convert at the database boundary.
 */

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/

/** Formats a TIME value from Prisma as 'HH:MM:SS'. */
export function timeOfDayToString(value: Date): string {
  return value.toISOString().slice(11, 19)
}

/** Converts 'HH:MM' or 'HH:MM:SS' into the Date that Prisma stores in a TIME column. */
export function timeOfDayFromString(value: string): Date {
  const match = TIME_PATTERN.exec(value.trim())
  if (!match) {
    throw new Error(`Invalid time of day: "${value}"`)
  }
  const [, hours, minutes, seconds = '00'] = match
  return new Date(`1970-01-01T${hours}:${minutes}:${seconds}.000Z`)
}
