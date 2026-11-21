const DAY_MS = 86_400_000

/** A calendar date (YYYY-MM-DD) as a whole number of days since 1970-01-01. */
export function dayNumber(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Math.round(Date.UTC(year, month - 1, day) / DAY_MS)
}

/** The calendar date (YYYY-MM-DD) of a day number. */
export function dateOfDay(day: number): string {
  return new Date(day * DAY_MS).toISOString().slice(0, 10)
}
