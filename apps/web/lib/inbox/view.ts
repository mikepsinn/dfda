import { DateTime } from 'luxon'

/**
 * Pure helpers for the patient inbox (components/inbox), modeled on
 * QuantiModo's reminder inbox: its day dividers, its recent-value buttons
 * and its card titles. See docs/MIGRATION.md, "Patient app modeled on QuantiModo".
 */

export const DAY_GROUPS = ['Today', 'Yesterday', 'Last 7 days', 'Last 30 days', 'Older'] as const
export type DayGroup = (typeof DAY_GROUPS)[number]

/** The divider a time falls under, counted in calendar days in the person's time zone. */
export function dayGroup(at: Date | string, zone: string, now: Date = new Date()): DayGroup {
  const day = DateTime.fromJSDate(typeof at === 'string' ? new Date(at) : at).setZone(zone).startOf('day')
  const today = DateTime.fromJSDate(now).setZone(zone).startOf('day')
  const daysAgo = Math.round(today.diff(day, 'days').days)
  if (daysAgo <= 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo < 7) return 'Last 7 days'
  if (daysAgo < 30) return 'Last 30 days'
  return 'Older'
}

/** Items under their dividers, in divider order, keeping the items' order. Empty dividers are left out. */
export function groupByDay<T extends { dueAt: string }>(items: T[], zone: string, now: Date = new Date()) {
  const groups = new Map<DayGroup, T[]>()
  for (const item of items) {
    const group = dayGroup(item.dueAt, zone, now)
    groups.set(group, [...(groups.get(group) ?? []), item])
  }
  return DAY_GROUPS.filter((group) => groups.has(group)).map((group) => ({ group, items: groups.get(group)! }))
}

/**
 * The one-tap values on a numeric card: the reminder's default value, then the
 * most recent distinct values, at most `max`. QuantiModo offered the last
 * values and the most common ones.
 */
export function presetValues(defaultValue: number | null, recentValues: number[], max = 4): number[] {
  const values = defaultValue === null ? recentValues : [defaultValue, ...recentValues]
  return [...new Set(values.filter((value) => Number.isFinite(value)))].slice(0, max)
}

/** A card's title: the reminder's own title, "Rate …" for a rating, or the variable's name. */
export function inboxTitle(variableName: string, isRating: boolean, customTitle?: string | null): string {
  if (customTitle?.trim()) return customTitle.trim()
  return isRating ? `Rate ${variableName}` : variableName
}
