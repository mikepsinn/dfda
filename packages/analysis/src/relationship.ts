import { dateOfDay } from './days'
import { correlationPValue, effectivePairs, effectivePairsAr1, effectiveTests, sidak } from './dependence'
import { pairBuffer, pairInto, seriesOf, totalsOf, type PairBuffer, type Series, type Variable, type Window } from './pairs'
import { detrended, mean, pearson } from './statistics'

/**
 * How one of a person's variables relates to another: QuantiModo's personal
 * correlation (QMUserCorrelation), with its onset delay and duration of action
 * found from the data instead of set per category, and a p-value that allows
 * for that search and for runs of similar days.
 *
 * Several windows (onset delay and duration of action) are tried. In each,
 * both series lose their straight-line trend over the paired days first, so
 * that two things that merely changed over the same months do not count as
 * related. That correlation gets a p-value from Student's t on the effective
 * number of pairs, which allows for runs of similar days (dependence.ts): the
 * smaller of Bartlett's and the first-order autoregressive estimate, from the
 * series before their trends are removed. The window with the smallest
 * p-value is kept. Trying several windows makes a small
 * p-value more likely by chance, so the kept p-value is corrected for the
 * effective number of independent windows: windows that share most of their
 * days count as fewer than their number (Šidák, with Li and Ji's count). A
 * window reaches back at most a quarter of the predictor's days, so that its
 * averages rest on enough data.
 *
 * Changes from QuantiModo, for these reasons: its p-value was the normal
 * density of a t-value, not a probability, treated pairs as independent and
 * did not allow for trends;
 * its windows were fixed per category and its searches over delays and
 * durations were only charted; days were UTC days, where the caller here gives
 * local days; and its QM score and "statistical significance" were
 * heuristics, not kept here.
 */

/** Changes whenever a change to the calculation changes results. */
export const METHOD_VERSION = 'personal-relationship-1'

export const ONSET_DELAYS_DAYS = [0, 1, 2, 4, 8] as const
export const DURATIONS_OF_ACTION_DAYS = [1, 2, 4, 8, 16] as const

export const WINDOWS: Window[] = ONSET_DELAYS_DAYS.flatMap((onsetDelayDays) =>
  DURATIONS_OF_ACTION_DAYS.map((durationOfActionDays) => ({ onsetDelayDays, durationOfActionDays })))

/** How many days before the outcome a window reaches (0 for the same day). */
export const reachOf = (window: Window) => window.onsetDelayDays + window.durationOfActionDays - 1

/** The windows tried for a predictor tracked over `days` days: those reaching back at most a quarter of them. */
export function windowsFor(days: number): Window[] {
  return WINDOWS.filter((window) => reachOf(window) <= Math.floor((days - 1) / 4))
}

/** Fewest pairs for a window's correlation to count. */
export const MIN_PAIRS = 4
/** Fewest days with a measurement: QuantiModo's minimums for the predictor and the outcome. */
export const MIN_PREDICTOR_DAYS = 4
export const MIN_OUTCOME_DAYS = 3

export type WindowResult = Window & {
  pairs: number
  correlation: number | null
  /** The correlation once each series' straight-line trend is removed. */
  trendAdjustedCorrelation: number | null
  /** The pairs counted as independent, allowing for runs of similar days. */
  effectivePairs: number | null
  /** This window's own p-value, before allowing for the other windows tried. */
  pValue: number | null
}

export type Relationship = {
  methodVersion: string
  onsetDelayDays: number
  durationOfActionDays: number
  /** The windows tried, with their pairs, correlation and own p-value. */
  windows: WindowResult[]
  /** How many independent windows the windows tried count as. */
  effectiveWindows: number
  numberOfPairs: number
  effectivePairs: number
  firstPairDate: string
  lastPairDate: string
  predictorDays: number
  outcomeDays: number
  /** Pearson's correlation of the pairs of the window kept. */
  correlation: number
  /** The same once each series' straight-line trend over the days is removed; the p-value is for this one. */
  trendAdjustedCorrelation: number
  /** The same window with the roles swapped: the outcome before the predictor. */
  reverseCorrelation: number | null
  /** The chance of a correlation this strong in any of the windows tried, when the variables are unrelated. */
  pValue: number
  /** The pairs with the predictor below its average, and at or above it. */
  lowPredictorPairs: number
  highPredictorPairs: number
  predictorLowAverage: number
  predictorHighAverage: number
  outcomeWithLowPredictor: number
  outcomeWithHighPredictor: number
  /** The predictor's average in pairs with the outcome above, and below, its average. */
  valuePredictingHighOutcome: number | null
  valuePredictingLowOutcome: number | null
}

type Prepared = { start: number; values: Float64Array; totals: ReturnType<typeof totalsOf>; filled: boolean }

function prepare(series: Series): Prepared {
  return { ...series, totals: totalsOf(series.start, series.values) }
}

/** The averaged side of a window's pairs by day: the predictor's window when it is filled, else the outcome's. */
type Averaged = { days: Int32Array; values: Float64Array }

/** Pearson's correlation of two windows' averaged values on the days both have. */
function sharedCorrelation(a: Averaged, b: Averaged): number {
  const xs: number[] = []
  const ys: number[] = []
  for (let i = 0, j = 0; i < a.days.length && j < b.days.length;) {
    if (a.days[i] === b.days[j]) {
      xs.push(a.values[i++])
      ys.push(b.values[j++])
    } else if (a.days[i] < b.days[j]) i++
    else j++
  }
  return xs.length >= MIN_PAIRS ? pearson(xs, ys) ?? 0 : 0
}

/**
 * Each window's result, the index of the window with the smallest p-value
 * (-1 for none), and how many independent windows they count as.
 */
function correlate(windows: Window[], predictor: Prepared, outcome: Prepared, buffer: PairBuffer) {
  const results: WindowResult[] = []
  const averaged: Averaged[] = []
  let best = -1
  windows.forEach((window, index) => {
    pairInto(predictor, outcome, window, buffer)
    const n = buffer.length
    const correlation = n >= MIN_PAIRS ? pearson(buffer.predictor, buffer.outcome, n) : null
    const xs = correlation === null ? null : detrended(buffer.predictor, buffer.days, n)
    const ys = correlation === null ? null : detrended(buffer.outcome, buffer.days, n)
    const adjusted = xs && ys ? pearson(xs, ys, n) : null
    if (correlation === null || adjusted === null) {
      results.push({ ...window, pairs: n, correlation, trendAdjustedCorrelation: null, effectivePairs: null, pValue: null })
      return
    }
    // Runs of similar days, measured before the trends are removed, which would hide part of them.
    const effective = Math.min(
      effectivePairs(buffer.predictor, buffer.outcome, n),
      effectivePairsAr1(buffer.predictor, buffer.outcome, n),
    )
    // One degree of freedom fewer than usual for the trend removed (a partial correlation).
    const pValue = correlationPValue(adjusted, effective - 3)
    results.push({ ...window, pairs: n, correlation, trendAdjustedCorrelation: adjusted, effectivePairs: effective, pValue })
    averaged.push({ days: buffer.days.slice(0, n), values: predictor.filled ? xs! : ys! })
    if (best < 0 || pValue < results[best].pValue!) best = index
  })
  const matrix: number[][] = averaged.map((_, i) => averaged.map((__, j) => (i === j ? 1 : 0)))
  for (let i = 0; i < averaged.length; i++) {
    for (let j = i + 1; j < averaged.length; j++) matrix[i][j] = matrix[j][i] = sharedCorrelation(averaged[i], averaged[j])
  }
  return { results, best, effectiveWindows: effectiveTests(matrix) }
}

function averageWhere(values: Float64Array, keep: (i: number) => boolean, length: number): { average: number; count: number } {
  let total = 0
  let count = 0
  for (let i = 0; i < length; i++) {
    if (!keep(i)) continue
    total += values[i]
    count++
  }
  return { average: count ? total / count : Number.NaN, count }
}

/** The relationship of a predictor to an outcome, or null when their data cannot relate them. */
export function analyzeRelationship(predictorVariable: Variable, outcomeVariable: Variable): Relationship | null {
  const predictorDays = predictorVariable.daily.filter((d) => !d.filled).length
  const outcomeDays = outcomeVariable.daily.filter((d) => !d.filled).length
  if (predictorDays < MIN_PREDICTOR_DAYS || outcomeDays < MIN_OUTCOME_DAYS) return null

  const predictor = prepare(seriesOf(predictorVariable))
  const outcome = prepare(seriesOf(outcomeVariable))
  const windows = windowsFor(predictor.values.length)
  const buffer = pairBuffer(Math.max(predictor.values.length, outcome.values.length))
  const { results, best, effectiveWindows } = correlate(windows, predictor, outcome, buffer)
  if (best < 0) return null
  const kept = results[best]

  const window = windows[best]
  pairInto(predictor, outcome, window, buffer)
  const n = buffer.length
  const xs = buffer.predictor
  const ys = buffer.outcome
  const predictorAverage = mean(xs, n)
  const outcomeAverage = mean(ys, n)
  const low = (i: number) => xs[i] < predictorAverage
  const high = (i: number) => xs[i] >= predictorAverage
  const predictorLow = averageWhere(xs, low, n)
  const predictorHigh = averageWhere(xs, high, n)
  const valueHigh = averageWhere(xs, (i) => ys[i] > outcomeAverage, n)
  const valueLow = averageWhere(xs, (i) => ys[i] < outcomeAverage, n)
  const result: Omit<Relationship, 'reverseCorrelation'> = {
    methodVersion: METHOD_VERSION,
    ...window,
    windows: results,
    effectiveWindows,
    numberOfPairs: n,
    effectivePairs: kept.effectivePairs!,
    firstPairDate: dateOfDay(buffer.days[0]),
    lastPairDate: dateOfDay(buffer.days[n - 1]),
    predictorDays,
    outcomeDays,
    correlation: kept.correlation!,
    trendAdjustedCorrelation: kept.trendAdjustedCorrelation!,
    pValue: sidak(kept.pValue!, Math.max(1, effectiveWindows)),
    lowPredictorPairs: predictorLow.count,
    highPredictorPairs: predictorHigh.count,
    predictorLowAverage: predictorLow.average,
    predictorHighAverage: predictorHigh.average,
    outcomeWithLowPredictor: averageWhere(ys, low, n).average,
    outcomeWithHighPredictor: averageWhere(ys, high, n).average,
    valuePredictingHighOutcome: valueHigh.count ? valueHigh.average : null,
    valuePredictingLowOutcome: valueLow.count ? valueLow.average : null,
  }

  // The roles swapped in the same window: does the outcome come before the predictor as strongly?
  pairInto(outcome, predictor, window, buffer)
  const reverseCorrelation = buffer.length >= MIN_PAIRS ? pearson(buffer.predictor, buffer.outcome, buffer.length) : null
  return { ...result, reverseCorrelation }
}
