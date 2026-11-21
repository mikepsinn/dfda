import { describe, expect, it } from 'vitest'
import { dateOfDay } from '../src/days'
import type { DailyValue } from '../src/daily'
import { correlationPValue } from '../src/dependence'
import type { Variable } from '../src/pairs'
import { analyzeRelationship, reachOf, WINDOWS, windowsFor } from '../src/relationship'

/** A seeded random number generator (mulberry32), so the tests are the same on every run. */
function random(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const START = 20_000 // 2024-10-04
const series = (values: (number | null)[], filled = false, from = START): Variable => ({
  daily: values.flatMap((value, i): DailyValue[] => (value === null ? [] : [{ day: dateOfDay(from + i), value, filled: false }])),
  filled,
})

describe('analyzeRelationship', () => {
  it("finds a dose that sets the next day's outcome, up or down", () => {
    const next = random(7)
    const doses = Array.from({ length: 60 }, () => Math.round(next() * 4))
    const dose = series(doses, true)
    const up = analyzeRelationship(dose, series(doses.map((d) => 10 + d), false, START + 1))!
    expect(up).toMatchObject({ onsetDelayDays: 1, durationOfActionDays: 1, numberOfPairs: 60, correlation: 1 })
    expect(up.pValue).toBeLessThan(1e-6)
    expect(up.valuePredictingHighOutcome!).toBeGreaterThan(up.valuePredictingLowOutcome!)
    const down = analyzeRelationship(dose, series(doses.map((d) => 10 - d), false, START + 1))!
    expect(down).toMatchObject({ onsetDelayDays: 1, durationOfActionDays: 1, correlation: -1 })
  })

  it('finds the onset delay and duration of action from the data', () => {
    const next = random(1)
    const dose = Array.from({ length: 120 }, () => (next() < 0.4 ? 1 : 0))
    // The outcome follows the average dose of the 4 days ending 2 days earlier, with noise.
    const outcome = dose.map((_, t) => (t < 5 ? null : 5 + 3 * (dose[t - 2] + dose[t - 3] + dose[t - 4] + dose[t - 5]) / 4 + next() - 0.5))
    const result = analyzeRelationship(series(dose, true), series(outcome))!
    expect(result).toMatchObject({ onsetDelayDays: 2, durationOfActionDays: 4 })
    expect(result.correlation).toBeGreaterThan(0.8)
    expect(result.pValue).toBeLessThan(1e-6)
    expect(result.outcomeWithHighPredictor).toBeGreaterThan(result.outcomeWithLowPredictor)
    expect(result.windows).toHaveLength(WINDOWS.length)
    expect(result.effectiveWindows).toBeGreaterThan(1)
    expect(result.effectiveWindows).toBeLessThan(WINDOWS.length)
  })

  it('does not count two things that merely changed over the same months as related', () => {
    const next = random(3)
    const dose = Array.from({ length: 100 }, (_, t) => t / 25 + next() * 2)
    const outcome = Array.from({ length: 100 }, (_, t) => t / 25 + next() * 2)
    const result = analyzeRelationship(series(dose), series(outcome))!
    expect(result.correlation).toBeGreaterThan(0.5)
    // Taken as 100 independent pairs, this correlation would look certain.
    expect(correlationPValue(result.correlation, result.numberOfPairs - 2)).toBeLessThan(1e-6)
    expect(Math.abs(result.trendAdjustedCorrelation)).toBeLessThan(0.3)
    expect(result.effectivePairs).toBeLessThan(result.numberOfPairs / 2)
    expect(result.pValue).toBeGreaterThan(0.05)
  })

  it('splits the pairs at the average predictor, and finds the values predicting a high and a low outcome', () => {
    // Doses with the outcome on the same day.
    const dose = series([0, 4, 0, 2, 4, 2], true)
    const outcome = series([1, 5, 1, 3, 6, 2])
    const result = analyzeRelationship(dose, outcome)!
    expect(result).toMatchObject({ onsetDelayDays: 0, durationOfActionDays: 1, numberOfPairs: 6 })
    // Average dose 2: below it the two days without a dose, at or above it the other four.
    expect(result).toMatchObject({ lowPredictorPairs: 2, highPredictorPairs: 4, predictorLowAverage: 0, predictorHighAverage: 3 })
    expect(result.outcomeWithLowPredictor).toBe(1)
    expect(result.outcomeWithHighPredictor).toBe(4)
    // Average outcome 3: above it the doses 4 and 4, below it 0, 0 and 2.
    expect(result.valuePredictingHighOutcome).toBe(4)
    expect(result.valuePredictingLowOutcome).toBeCloseTo(2 / 3, 10)
  })

  it("tries windows reaching back at most a quarter of the predictor's days", () => {
    expect(windowsFor(20).every((w) => reachOf(w) <= 4)).toBe(true)
    expect(windowsFor(20).map(reachOf)).toContain(4)
    expect(windowsFor(93)).toHaveLength(WINDOWS.length)
  })

  it('is null without enough days or without variation', () => {
    expect(analyzeRelationship(series([1, 2, 3], true), series([1, 2, 3, 4, 5]))).toBeNull()
    expect(analyzeRelationship(series([2, 2, 2, 2, 2, 2], true), series([1, 2, 3, 4, 5, 6]))).toBeNull()
  })

  // Unrelated variables should reach p < 0.05 about 5% of the time, also with
  // runs of similar days. Keeping the best window's own p-value, without
  // allowing for the other windows tried, finds a "relationship" far more often.
  it.each([
    { label: 'independent days', persistence: 0 },
    { label: 'runs of similar days', persistence: 0.8 },
  ])('keeps false findings near 5% when nothing is related ($label)', ({ persistence }) => {
    const datasets = 400
    let corrected = 0
    let uncorrected = 0
    for (let seed = 0; seed < datasets; seed++) {
      const next = random(1000 + seed)
      const noise = () => next() * 2 - 1
      let p = 0
      let o = 0
      const dose: number[] = []
      const outcome: (number | null)[] = []
      for (let t = 0; t < 90; t++) {
        p = persistence * p + noise()
        o = persistence * o + noise()
        dose.push(p > 0.3 ? 1 : 0)
        outcome.push(next() < 0.2 ? null : o)
      }
      const result = analyzeRelationship(series(dose, true), series(outcome))
      if (!result) continue
      if (result.pValue < 0.05) corrected++
      if (Math.min(...result.windows.map((w) => w.pValue ?? 1)) < 0.05) uncorrected++
    }
    expect(corrected / datasets).toBeLessThan(0.08)
    expect(uncorrected).toBeGreaterThan(2 * corrected)
  })
})
