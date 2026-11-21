import { DateTime } from 'luxon'
import { dayOf } from '@/lib/reminders/due'
import { zoneOf } from '@/lib/reminders/schedule'
import type { TrackingDb } from '@/lib/tracking/variables'
import { valueInUnit } from '@/lib/units/convert'
import { dailyValues, type DailyRules, type DailyValue, type DayValue } from 'analysis'
import {
  dailyRulesFor, dailyStats, distribution, weekdayAverages,
  type DailyStats, type DistributionBin, type WeekdayAverage,
} from './variable-stats'

/**
 * The patient app's page for one variable (docs/MIGRATION.md, "Patient app
 * modeled on QuantiModo", phase 3): its daily values over a period, their
 * statistics, distribution and weekday averages, and the rules that made the
 * daily values. Runs in the signed-in person's transaction (withUserTransaction).
 */

export const RANGES = [
  { id: '30d', label: '30 days', days: 30 },
  { id: '90d', label: '90 days', days: 90 },
  { id: '1y', label: '1 year', days: 365 },
  { id: 'all', label: 'All time', days: null },
] as const

export type RangeId = (typeof RANGES)[number]['id']
export const DEFAULT_RANGE: RangeId = '90d'

export function rangeOf(value: string | undefined): RangeId {
  return RANGES.find((range) => range.id === value)?.id ?? DEFAULT_RANGE
}

export type VariablePageData = {
  userVariableId: string
  globalVariableId: string
  name: string
  emoji: string | null
  category: string
  unit: { id: string; abbreviatedName: string }
  rules: DailyRules
  hasReminder: boolean
  range: RangeId
  /** Measurements in the period, and of all time. */
  measurementCount: number
  allTime: { count: number; firstAt: string | null; latestAt: string | null }
  daily: DailyValue[]
  stats: DailyStats | null
  distribution: DistributionBin[]
  weekdays: WeekdayAverage[]
  timezone: string
}

const convertible = { id: true, unit_category_id: true, conversion_factor: true, conversion_offset: true } as const

/** The page of one of the person's variables, by its id or by the global variable's id; null when they do not have it. */
export async function loadVariablePage(
  tx: TrackingDb,
  userId: string,
  ref: { userVariableId: string } | { globalVariableId: string },
  range: RangeId,
  now: Date = new Date(),
): Promise<VariablePageData | null> {
  const row = await tx.user_variables.findFirst({
    where: { user_id: userId, deleted_at: null, ...('userVariableId' in ref ? { id: ref.userVariableId } : { global_variable_id: ref.globalVariableId }) },
    select: {
      id: true,
      units: { select: { ...convertible, abbreviated_name: true } },
      global_variables: {
        select: {
          id: true, name: true, emoji: true, variable_category_id: true, molar_mass: true,
          variable_categories: { select: { name: true } }, units: { select: { ...convertible, abbreviated_name: true } },
        },
      },
    },
  })
  if (!row) return null
  const unit = row.units ?? row.global_variables.units
  const variable = {
    userVariableId: row.id,
    globalVariableId: row.global_variables.id,
    molarMass: row.global_variables.molar_mass,
    rules: dailyRulesFor({ categoryId: row.global_variables.variable_category_id, unitId: unit.id }),
  }
  const profile = await tx.profiles.findUnique({ where: { id: userId }, select: { timezone: true } })
  const zone = zoneOf(profile?.timezone)
  const days = RANGES.find((r) => r.id === range)!.days
  const since = days === null ? null : DateTime.fromJSDate(now).setZone(zone).startOf('day').minus({ days: days - 1 }).toJSDate()
  const own = { user_id: userId, global_variable_id: variable.globalVariableId, deleted_at: null }

  const [measurements, allTime, reminders] = await Promise.all([
    tx.measurements.findMany({
      where: { ...own, ...(since ? { start_at: { gte: since } } : {}) },
      select: { value: true, start_at: true, units: { select: convertible } },
      orderBy: { start_at: 'asc' },
    }),
    tx.measurements.aggregate({ where: own, _count: { _all: true }, _min: { start_at: true }, _max: { start_at: true } }),
    tx.reminder_schedules.count({ where: { user_variable_id: variable.userVariableId, user_id: userId } }),
  ])

  // Each value in the person's unit for the variable; one that does not convert is left out.
  const values: DayValue[] = measurements.flatMap((m) => {
    const value = valueInUnit(Number(m.value), m.units, unit, variable.molarMass)
    return value === null ? [] : [{ day: dayOf(m.start_at, zone), value }]
  })
  const daily = dailyValues(values, variable.rules)
  return {
    userVariableId: variable.userVariableId,
    globalVariableId: variable.globalVariableId,
    name: row.global_variables.name,
    emoji: row.global_variables.emoji,
    category: row.global_variables.variable_categories.name,
    unit: { id: unit.id, abbreviatedName: unit.abbreviated_name },
    rules: variable.rules,
    hasReminder: reminders > 0,
    range,
    measurementCount: measurements.length,
    allTime: {
      count: allTime._count._all,
      firstAt: allTime._min.start_at?.toISOString() ?? null,
      latestAt: allTime._max.start_at?.toISOString() ?? null,
    },
    daily,
    stats: dailyStats(daily),
    distribution: distribution(daily),
    weekdays: weekdayAverages(daily),
    timezone: zone,
  }
}
