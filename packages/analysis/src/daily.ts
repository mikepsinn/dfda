import { dateOfDay, dayNumber } from './days'

/**
 * Daily values, as QuantiModo made them for its charts and analyses: a day's
 * measurements make one daily value, by their sum or their mean, and days
 * without a measurement are left out or counted as zero. Values keep their full
 * precision.
 */

export type CombinationOperation = 'SUM' | 'MEAN'
export type FillingType = 'none' | 'zero'

export type DailyRules = { combination: CombinationOperation; fillingType: FillingType }

/** One measurement on its local day (YYYY-MM-DD), in the unit of the analysis. */
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
  const last = dayNumber(measured[measured.length - 1].day)
  for (let day = dayNumber(measured[0].day); day <= last; day++) {
    const iso = dateOfDay(day)
    result.push(known.get(iso) ?? { day: iso, value: 0, filled: true })
  }
  return result
}
