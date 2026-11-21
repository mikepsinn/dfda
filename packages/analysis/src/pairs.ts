import type { DailyValue } from './daily'
import { dateOfDay, dayNumber } from './days'

/**
 * Pairing a predictor's daily values with an outcome's, as QuantiModo did
 * (QMUserCorrelation and GetPairRequest), on whole days:
 *
 * - When a day without the predictor counts as zero (a dose), each day with an
 *   outcome value is paired with the predictor's average over the duration of
 *   action that ends the onset delay before it.
 * - Otherwise (a rating, hours of sleep), each day with a predictor value is
 *   paired with the outcome's average over the duration of action that starts
 *   the onset delay after it.
 *
 * Unlike QuantiModo, a window must lie within the days its variable was
 * tracked, so that each average covers the whole window.
 */

export type Window = { onsetDelayDays: number; durationOfActionDays: number }

/** A variable's daily values, and whether a day without a measurement counts as zero. */
export type Variable = { daily: DailyValue[]; filled: boolean }

/** A variable's daily values by day: values[i] is day start + i, NaN for a day without a value. */
export type Series = { start: number; values: Float64Array; filled: boolean }

export function seriesOf(variable: Variable): Series {
  const days = variable.daily.map((d) => dayNumber(d.day))
  const start = days.reduce((a, b) => Math.min(a, b))
  const end = days.reduce((a, b) => Math.max(a, b))
  const values = new Float64Array(end - start + 1).fill(Number.NaN)
  variable.daily.forEach((d, i) => { values[days[i] - start] = d.value })
  return { start, values, filled: variable.filled }
}

/** Running totals of a series, for the average over any window in constant time. */
export type Totals = { start: number; sums: Float64Array; counts: Int32Array }

export function totalsOf(start: number, values: Float64Array): Totals {
  const sums = new Float64Array(values.length + 1)
  const counts = new Int32Array(values.length + 1)
  for (let i = 0; i < values.length; i++) {
    const present = !Number.isNaN(values[i])
    sums[i + 1] = sums[i] + (present ? values[i] : 0)
    counts[i + 1] = counts[i] + (present ? 1 : 0)
  }
  return { start, sums, counts }
}

/** The average of the values from day `from` to day `to`, or NaN when the window is not within the series or has no value. */
function windowAverage(totals: Totals, from: number, to: number): number {
  const a = from - totals.start
  const b = to - totals.start
  if (a < 0 || b >= totals.counts.length - 1) return Number.NaN
  const count = totals.counts[b + 1] - totals.counts[a]
  return count === 0 ? Number.NaN : (totals.sums[b + 1] - totals.sums[a]) / count
}

/** Pairs written into reusable arrays; the first `length` entries are the pairs, in day order. */
export type PairBuffer = { predictor: Float64Array; outcome: Float64Array; days: Int32Array; length: number }

export function pairBuffer(size: number): PairBuffer {
  return { predictor: new Float64Array(size), outcome: new Float64Array(size), days: new Int32Array(size), length: 0 }
}

/** The pairs of a window, from series prepared with their running totals. */
export function pairInto(
  predictor: { start: number; values: Float64Array; totals: Totals; filled: boolean },
  outcome: { start: number; values: Float64Array; totals: Totals },
  window: Window,
  out: PairBuffer,
): void {
  const delay = window.onsetDelayDays
  const duration = window.durationOfActionDays
  let n = 0
  if (predictor.filled) {
    for (let i = 0; i < outcome.values.length; i++) {
      const y = outcome.values[i]
      if (Number.isNaN(y)) continue
      const day = outcome.start + i
      const x = windowAverage(predictor.totals, day - delay - duration + 1, day - delay)
      if (Number.isNaN(x)) continue
      out.predictor[n] = x
      out.outcome[n] = y
      out.days[n] = day
      n++
    }
  } else {
    for (let i = 0; i < predictor.values.length; i++) {
      const x = predictor.values[i]
      if (Number.isNaN(x)) continue
      const day = predictor.start + i
      const y = windowAverage(outcome.totals, day + delay, day + delay + duration - 1)
      if (Number.isNaN(y)) continue
      out.predictor[n] = x
      out.outcome[n] = y
      out.days[n] = day
      n++
    }
  }
  out.length = n
}

export type Pair = { day: string; predictor: number; outcome: number }

/** The pairs of a window, for charts and tests. */
export function pairsInWindow(predictor: Variable, outcome: Variable, window: Window): Pair[] {
  if (predictor.daily.length === 0 || outcome.daily.length === 0) return []
  const p = seriesOf(predictor)
  const o = seriesOf(outcome)
  const out = pairBuffer(Math.max(p.values.length, o.values.length))
  pairInto(
    { ...p, totals: totalsOf(p.start, p.values) },
    { ...o, totals: totalsOf(o.start, o.values) },
    window,
    out,
  )
  return Array.from({ length: out.length }, (_, i) => ({ day: dateOfDay(out.days[i]), predictor: out.predictor[i], outcome: out.outcome[i] }))
}
