import { describe, expect, it } from 'vitest'
import {
  dailyRulesFor, dailyStats, dailyValues, distribution, weekdayAverages, type DailyValue,
} from '@/lib/patient/variable-stats'

const day = (d: string, value: number): DailyValue => ({ day: d, value, filled: false })

describe('dailyRulesFor', () => {
  it('averages ratings and readings, and sums amounts taken or done, counting a missing dose as none', () => {
    expect(dailyRulesFor({ categoryId: 'mental-and-emotional-state', unitId: 'zero-to-ten-scale' })).toEqual({ combination: 'MEAN', fillingType: 'none' })
    expect(dailyRulesFor({ categoryId: 'intake-and-interventions', unitId: 'one-to-five-scale' })).toEqual({ combination: 'MEAN', fillingType: 'none' })
    expect(dailyRulesFor({ categoryId: 'intake-and-interventions', unitId: 'milligram' })).toEqual({ combination: 'SUM', fillingType: 'zero' })
    expect(dailyRulesFor({ categoryId: 'activity-and-behavior', unitId: 'count' })).toEqual({ combination: 'SUM', fillingType: 'none' })
    expect(dailyRulesFor({ categoryId: 'health-and-physiology', unitId: 'kilogram' })).toEqual({ combination: 'MEAN', fillingType: 'none' })
  })
})

describe('dailyValues', () => {
  const values = [
    { day: '2026-11-03', value: 2 },
    { day: '2026-11-01', value: 4 },
    { day: '2026-11-01', value: 6 },
  ]

  it('makes one value a day, by sum or mean, oldest first', () => {
    expect(dailyValues(values, { combination: 'SUM', fillingType: 'none' })).toEqual([day('2026-11-01', 10), day('2026-11-03', 2)])
    expect(dailyValues(values, { combination: 'MEAN', fillingType: 'none' })).toEqual([day('2026-11-01', 5), day('2026-11-03', 2)])
  })

  it('counts the days between the first and last measured day as zero when a missing day means none', () => {
    expect(dailyValues(values, { combination: 'SUM', fillingType: 'zero' })).toEqual([
      day('2026-11-01', 10),
      { day: '2026-11-02', value: 0, filled: true },
      day('2026-11-03', 2),
    ])
  })
})

describe('dailyStats', () => {
  it('gives the mean, median, most common value, sample standard deviation and range', () => {
    expect(dailyStats([day('a', 2), day('b', 4), day('c', 4), day('d', 6)])).toEqual({
      days: 4, mean: 4, median: 4, mostCommon: 4, standardDeviation: 1.63, minimum: 2, maximum: 6,
    })
    expect(dailyStats([])).toBeNull()
  })
})

describe('distribution', () => {
  it('counts the days of each value when there are few, and of equal ranges when there are many', () => {
    expect(distribution([day('a', 3), day('b', 3), day('c', 5)]).map((bin) => [bin.label, bin.days])).toEqual([['3', 2], ['5', 1]])
    const many = Array.from({ length: 30 }, (_, i) => day(String(i), i))
    const bins = distribution(many)
    expect(bins).toHaveLength(12)
    expect(bins.reduce((total, bin) => total + bin.days, 0)).toBe(30)
  })
})

describe('weekdayAverages', () => {
  it('averages the daily values of each weekday, Monday first', () => {
    // 2026-11-02 and 2026-11-09 are Mondays; 2026-11-04 is a Wednesday.
    const weekdays = weekdayAverages([day('2026-11-02', 2), day('2026-11-09', 4), day('2026-11-04', 7)])
    expect(weekdays[0]).toEqual({ weekday: 'Mon', average: 3, days: 2 })
    expect(weekdays[2]).toEqual({ weekday: 'Wed', average: 7, days: 1 })
    expect(weekdays[6]).toEqual({ weekday: 'Sun', average: null, days: 0 })
  })
})
