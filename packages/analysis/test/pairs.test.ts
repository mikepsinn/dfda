import { describe, expect, it } from 'vitest'
import { dailyValues, type DailyValue } from '../src/daily'
import { pairsInWindow, type Variable } from '../src/pairs'
import { pearson } from '../src/statistics'

// Known answers from QuantiModo's own tests (tests/UnitTests/Analytics in its
// repository), on whole days.

const measured = (entries: [string, number][]): DailyValue[] => entries.map(([day, value]) => ({ day, value, filled: false }))
const days = (values: number[], from = 1) => measured(values.map((value, i) => [`1970-01-${String(from + i).padStart(2, '0')}`, value]))

describe('pearson (CorrelationCalculationTest)', () => {
  it('is null when a series does not vary, and 1 or -1 for a perfect line', () => {
    expect(pearson([10, 20, 30, 25, 20, 15, 25, 15, 20, 10], Array(10).fill(10))).toBeNull()
    const ten = Array.from({ length: 10 }, (_, i) => i + 1)
    expect(pearson(ten, ten)).toBe(1)
    expect(pearson(ten.map((v) => -v), ten)).toBe(-1)
    expect(pearson([], [])).toBeNull()
  })

  it('keeps its precision for large values with a small spread', () => {
    const xs = [80_000.1, 80_000.2, 80_000.3, 80_000.4]
    expect(pearson(xs, [1, 2, 3, 4])).toBeCloseTo(1, 9)
  })
})

describe('pairsInWindow (PairTest)', () => {
  it('pairs each outcome day with the zero-filled dose of the day before (testCreateAbsolutePairsWithZeroFilling)', () => {
    // 2 mg on Jan 3 and 4 mg on Jan 5, so none on Jan 4; ratings 1 to 5 on Jan 2 to 6.
    const dose: Variable = {
      daily: dailyValues([{ day: '1970-01-03', value: 2 }, { day: '1970-01-05', value: 4 }], { combination: 'SUM', fillingType: 'zero' }),
      filled: true,
    }
    const rating: Variable = { daily: days([1, 2, 3, 4, 5], 2), filled: false }
    expect(pairsInWindow(dose, rating, { onsetDelayDays: 1, durationOfActionDays: 1 })).toEqual([
      { day: '1970-01-04', predictor: 2, outcome: 3 },
      { day: '1970-01-05', predictor: 0, outcome: 4 },
      { day: '1970-01-06', predictor: 4, outcome: 5 },
    ])
  })

  it('pairs each predictor day with the outcome averaged over the window after it (testAggregateEffectsWithMeanAndNoFilling)', () => {
    const series = measured([['1970-01-01', 1], ['1970-01-02', 2], ['1970-01-04', 4], ['1970-01-05', 5]])
    expect(pairsInWindow({ daily: series, filled: false }, { daily: series, filled: false }, { onsetDelayDays: 2, durationOfActionDays: 2 })).toEqual([
      { day: '1970-01-01', predictor: 1, outcome: 4 },
      { day: '1970-01-02', predictor: 2, outcome: 4.5 },
    ])
  })

  it('pairs a day with the next one, or with itself without a delay (testCreateAbsolutePairs and the NoDelay tests)', () => {
    const series = days([1, 2, 3, 4, 5])
    const next = pairsInWindow({ daily: series, filled: false }, { daily: series, filled: false }, { onsetDelayDays: 1, durationOfActionDays: 1 })
    expect(next.map((p) => [p.predictor, p.outcome])).toEqual([[1, 2], [2, 3], [3, 4], [4, 5]])
    const same = pairsInWindow({ daily: series, filled: false }, { daily: series, filled: false }, { onsetDelayDays: 0, durationOfActionDays: 1 })
    expect(same.every((p) => p.predictor === p.outcome)).toBe(true)
  })

  it('averages a dose over the whole window only, unlike QuantiModo, which also averaged part of one', () => {
    const dose: Variable = { daily: days([1, 2, 3, 4]), filled: true }
    const rating: Variable = { daily: days([5, 5, 5, 5, 5, 5]), filled: false }
    // A 2-day window ending the day before: Jan 3 (Jan 1 to 2) to Jan 5 (Jan 3 to 4); Jan 2 would reach before Jan 1.
    expect(pairsInWindow(dose, rating, { onsetDelayDays: 1, durationOfActionDays: 2 })).toEqual([
      { day: '1970-01-03', predictor: 1.5, outcome: 5 },
      { day: '1970-01-04', predictor: 2.5, outcome: 5 },
      { day: '1970-01-05', predictor: 3.5, outcome: 5 },
    ])
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
    expect(dailyValues(values, { combination: 'SUM', fillingType: 'none' })).toEqual(measured([['2026-11-01', 10], ['2026-11-03', 2]]))
    expect(dailyValues(values, { combination: 'MEAN', fillingType: 'none' })).toEqual(measured([['2026-11-01', 5], ['2026-11-03', 2]]))
  })

  it('counts the days between the first and last measured day as zero when a missing day means none', () => {
    expect(dailyValues(values, { combination: 'SUM', fillingType: 'zero' })).toEqual([
      { day: '2026-11-01', value: 10, filled: false },
      { day: '2026-11-02', value: 0, filled: true },
      { day: '2026-11-03', value: 2, filled: false },
    ])
  })
})
