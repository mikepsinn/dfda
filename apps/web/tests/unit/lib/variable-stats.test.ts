import { describe, expect, it } from 'vitest'
import { aggregateText, formatNumber, valueText } from '@/lib/patient/value-text'
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

  it('keeps full precision, so small converted amounts stay distinct', () => {
    expect(dailyValues([{ day: '2026-11-01', value: 0.081 }, { day: '2026-11-02', value: 0.0405 }], { combination: 'SUM', fillingType: 'none' })
      .map((d) => d.value)).toEqual([0.081, 0.0405])
    expect(dailyValues([{ day: '2026-11-01', value: 1 }, { day: '2026-11-01', value: 0 }, { day: '2026-11-01', value: 0 }], { combination: 'MEAN', fillingType: 'none' })[0].value)
      .toBeCloseTo(1 / 3, 10)
  })

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
    const stats = dailyStats([day('a', 2), day('b', 4), day('c', 4), day('d', 6)])
    expect(stats).toMatchObject({ days: 4, mean: 4, median: 4, mostCommon: 4, minimum: 2, maximum: 6 })
    expect(stats?.standardDeviation).toBeCloseTo(1.633, 3)
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

describe('aggregateText', () => {
  const unit = (id: string, abbreviatedName: string) => ({ id, abbreviatedName })

  it('shows an average of yes/no answers as the share of yes, unlike one answer', () => {
    expect(aggregateText(0.1, unit('boolean', 'bool'))).toBe('10% yes')
    expect(valueText(1, unit('boolean', 'bool'))).toBe('Yes')
  })

  it('rounds only for display: two decimals, or three significant digits below one', () => {
    expect(aggregateText(5.40845, unit('zero-to-ten-scale', '0-10'))).toBe('5.41 of 10')
    expect(aggregateText(0.081, unit('gram', 'g'))).toBe('0.081 g')
    expect(formatNumber(824.9999999999999)).toBe('825')
    expect(formatNumber(0)).toBe('0')
  })
})

