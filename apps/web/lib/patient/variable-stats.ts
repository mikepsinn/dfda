import { DateTime } from 'luxon'
import { getRatingRange, getVariableInputType } from '@/lib/variable-helpers'
import { formatNumber } from './value-text'

/**
 * Daily values and their statistics for the patient app's variable page
 * (docs/MIGRATION.md, "Patient app modeled on QuantiModo", phase 3), as
 * QuantiModo computed them for its charts: a day's measurements make one daily
 * value, by their sum or their mean, and days without a measurement are left
 * out or counted as zero. Values keep their full precision; only their display
 * is rounded (lib/patient/value-text.ts). Pure, so the server and tests share it.
 */

export type CombinationOperation = 'SUM' | 'MEAN'
export type FillingType = 'none' | 'zero'

export type DailyRules = { combination: CombinationOperation; fillingType: FillingType }

/** Categories whose amounts add up over a day: doses, foods, steps, minutes of exercise. */
const SUMMED_CATEGORIES = new Set(['intake-and-interventions', 'activity-and-behavior'])

/**
 * How a variable's measurements make daily values, as QuantiModo's categories
 * had it: a rating or yes/no is averaged; amounts taken or done are summed, and
 * a day without a dose counts as none taken; anything else (weights, lab
 * values) is averaged and a day without one is left out. These are properties
 * of the variable, not settings: a person does not choose them.
 */
export function dailyRulesFor(variable: { categoryId: string; unitId: string }): DailyRules {
  const inputType = getVariableInputType({ unitId: variable.unitId, variableCategory: null })
  const scale = inputType === 'boolean_yes_no' || getRatingRange(inputType) !== null
  return {
    combination: !scale && SUMMED_CATEGORIES.has(variable.categoryId) ? 'SUM' : 'MEAN',
    fillingType: !scale && variable.categoryId === 'intake-and-interventions' ? 'zero' : 'none',
  }
}

/** One measurement on its local day (YYYY-MM-DD), in the unit of the charts. */
export type DayValue = { day: string; value: number }

export type DailyValue = { day: string; value: number; /** True for a day without a measurement, counted as zero. */ filled: boolean }

/**
 * The daily values, oldest first. Filling covers the days between the first
 * and the last measured day, so a day not yet recorded is not counted.
 */
export function dailyValues(values: DayValue[], rules: DailyRules): DailyValue[] {
  const byDay = new Map<string, number[]>()
  for (const { day, value } of values) {
    if (!Number.isFinite(value)) continue
    byDay.set(day, [...(byDay.get(day) ?? []), value])
  }
  const measured = [...byDay.entries()]
    .map(([day, dayValues]) => {
      const sum = dayValues.reduce((total, value) => total + value, 0)
      return { day, value: rules.combination === 'SUM' ? sum : sum / dayValues.length, filled: false }
    })
    .sort((a, b) => a.day.localeCompare(b.day))
  if (rules.fillingType === 'none' || measured.length < 2) return measured

  const result: DailyValue[] = []
  const known = new Map(measured.map((value) => [value.day, value]))
  const last = DateTime.fromISO(measured[measured.length - 1].day, { zone: 'UTC' })
  for (let day = DateTime.fromISO(measured[0].day, { zone: 'UTC' }); day <= last; day = day.plus({ days: 1 })) {
    const iso = day.toISODate()!
    result.push(known.get(iso) ?? { day: iso, value: 0, filled: true })
  }
  return result
}

export type DailyStats = {
  days: number
  mean: number
  median: number
  mostCommon: number
  standardDeviation: number
  minimum: number
  maximum: number
}

/** Statistics of daily values, or null without any. The standard deviation is the sample's. */
export function dailyStats(daily: DailyValue[]): DailyStats | null {
  if (daily.length === 0) return null
  const values = daily.map((d) => d.value).sort((a, b) => a - b)
  const mean = values.reduce((total, value) => total + value, 0) / values.length
  const middle = Math.floor(values.length / 2)
  const median = values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2
  const counts = new Map<number, number>()
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1)
  // The most frequent value; of equally frequent ones, the lowest.
  const mostCommon = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0][0]
  const variance = values.length > 1 ? values.reduce((total, value) => total + (value - mean) ** 2, 0) / (values.length - 1) : 0
  return {
    days: values.length,
    mean,
    median,
    mostCommon,
    standardDeviation: Math.sqrt(variance),
    minimum: values[0],
    maximum: values[values.length - 1],
  }
}

export type DistributionBin = { label: string; from: number; to: number; days: number }

/** At most this many bars in the distribution; more distinct values are grouped into ranges. */
const MAX_BINS = 12

/**
 * How many days had each daily value: one bar per value when there are few
 * distinct values (ratings, doses), else equal ranges from the lowest value to
 * the highest.
 */
export function distribution(daily: DailyValue[]): DistributionBin[] {
  if (daily.length === 0) return []
  const values = daily.map((d) => d.value)
  const distinct = [...new Set(values)].sort((a, b) => a - b)
  if (distinct.length <= MAX_BINS) {
    return distinct.map((value) => ({ label: formatNumber(value), from: value, to: value, days: values.filter((v) => v === value).length }))
  }
  const low = distinct[0]
  const width = (distinct[distinct.length - 1] - low) / MAX_BINS
  return Array.from({ length: MAX_BINS }, (_, i) => {
    const from = low + i * width
    const to = low + (i + 1) * width
    const last = i === MAX_BINS - 1
    const days = values.filter((v) => v >= from && (last ? v <= to : v < to)).length
    return { label: `${formatNumber(from)}–${formatNumber(to)}`, from, to, days }
  })
}

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

export type WeekdayAverage = { weekday: (typeof WEEKDAYS)[number]; average: number | null; days: number }

/** The average daily value on each day of the week, Monday first; null for a weekday without values. */
export function weekdayAverages(daily: DailyValue[]): WeekdayAverage[] {
  return WEEKDAYS.map((weekday, index) => {
    const values = daily.filter((d) => DateTime.fromISO(d.day, { zone: 'UTC' }).weekday === index + 1).map((d) => d.value)
    return {
      weekday,
      average: values.length ? values.reduce((total, value) => total + value, 0) / values.length : null,
      days: values.length,
    }
  })
}
