import type { Better } from './config'

/**
 * The before/after report of a program, for one person and as totals for the
 * company. Pure functions: the pages pass in the values, from the database or
 * from the sample cohort (sample.ts).
 *
 * "Before" is the mean of the values up to a week after the start; "now" is
 * the mean of the latest values after that week. Each mean uses the last 14
 * days of values in its period, so one lab result or two weeks of daily
 * check-ins count alike. A change after the start does not prove that the
 * product caused it; the pages say so.
 */

export type Point = { at: Date; value: number }
export type MeasureStatus = 'improved' | 'unchanged' | 'worse' | 'changed' | 'waiting'

const DAY = 86_400_000
/** Values up to this many days after the start still count as the starting point. */
export const START_GRACE_DAYS = 7
/** Values older than this before the start do not count. */
export const LOOKBACK_DAYS = 90
/** Each mean uses the last this many days of values in its period. */
export const WINDOW_DAYS = 14
/** The company sees a measure only when at least this many people have both values. */
export const MIN_GROUP_SIZE = 5

export type MeasureResult = {
  before: number | null
  after: number | null
  change: number | null
  percentChange: number | null
  status: MeasureStatus
}

/** What the report shows for one tracked variable. */
export type ReportItem = {
  variableId: string
  name: string
  unitId: string
  unit: string
  kind: 'check_in' | 'lab'
  better: Better
}

function recentMean(points: Point[]): number | null {
  if (points.length === 0) return null
  const last = Math.max(...points.map((point) => point.at.getTime()))
  const recent = points.filter((point) => point.at.getTime() >= last - WINDOW_DAYS * DAY)
  return recent.reduce((sum, point) => sum + point.value, 0) / recent.length
}

/** The smallest change that counts: 1 point on a 0–10 scale, 0.5 on a 1–5 scale, else 5% of the starting value. */
export function changeThreshold(unitId: string, before: number) {
  if (unitId === 'zero-to-ten-scale' || unitId === 'one-to-ten-scale') return 1
  if (unitId === 'one-to-five-scale') return 0.5
  return Math.max(Math.abs(before) * 0.05, 1e-9)
}

export function compareMeasure(points: Point[], startedAt: Date, better: Better, unitId: string): MeasureResult {
  const cutoff = startedAt.getTime() + START_GRACE_DAYS * DAY
  const earliest = startedAt.getTime() - LOOKBACK_DAYS * DAY
  const before = recentMean(points.filter((point) => point.at.getTime() >= earliest && point.at.getTime() <= cutoff))
  const after = recentMean(points.filter((point) => point.at.getTime() > cutoff))
  if (before === null || after === null) return { before, after, change: null, percentChange: null, status: 'waiting' }

  const change = after - before
  const percentChange = before === 0 ? null : (change / Math.abs(before)) * 100
  let status: MeasureStatus
  if (Math.abs(change) < changeThreshold(unitId, before)) status = 'unchanged'
  else if (better === 'neither') status = 'changed'
  else status = change > 0 === (better === 'higher') ? 'improved' : 'worse'
  return { before, after, change, percentChange, status }
}

export type PersonReport = {
  startedAt: Date
  followUpAt: Date
  measures: (ReportItem & MeasureResult)[]
  verdict: string
}

function nameList(names: string[]) {
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

/** One sentence on the whole report, as the first line a person reads. */
export function verdictFor(measures: (ReportItem & MeasureResult)[]): string {
  const by = (status: MeasureStatus) => measures.filter((measure) => measure.status === status)
  const waiting = by('waiting')
  const compared = measures.length - waiting.length
  if (compared === 0) {
    return 'No comparison yet: the report needs a value from the start and one from at least a week later.'
  }
  const parts = [`${by('improved').length} of ${compared} measures improved.`]
  const worse = by('worse').map((measure) => measure.name)
  if (worse.length > 0) parts.push(`${nameList(worse)} got worse.`)
  const changed = by('changed').map((measure) => measure.name)
  if (changed.length > 0) parts.push(`${nameList(changed)} changed.`)
  if (waiting.length > 0) parts.push(`${waiting.length} still ${waiting.length === 1 ? 'needs' : 'need'} a second value.`)
  return parts.join(' ')
}

export function buildPersonReport(
  items: ReportItem[],
  series: Map<string, Point[]>,
  startedAt: Date,
  followUpWeeks: number,
): PersonReport {
  const measures = items.map((item) => ({
    ...item,
    ...compareMeasure(series.get(item.variableId) ?? [], startedAt, item.better, item.unitId),
  }))
  return {
    startedAt,
    followUpAt: new Date(startedAt.getTime() + followUpWeeks * 7 * DAY),
    measures,
    verdict: verdictFor(measures),
  }
}

export type MeasureTotals = ReportItem & {
  /** People with a value at both times. */
  people: number
  /** True when fewer than MIN_GROUP_SIZE people have both values: the counts are left out. */
  hidden: boolean
  improved: number
  unchanged: number
  worse: number
  changed: number
  medianPercentChange: number | null
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/** Totals per measure over many people's reports. Small groups are hidden, so no one person stands out. */
export function programTotals(items: ReportItem[], reports: PersonReport[]): MeasureTotals[] {
  return items.map((item) => {
    const results = reports
      .map((report) => report.measures.find((measure) => measure.variableId === item.variableId))
      .filter((measure): measure is ReportItem & MeasureResult => Boolean(measure) && measure!.status !== 'waiting')
    const count = (status: MeasureStatus) => results.filter((result) => result.status === status).length
    const hidden = results.length < MIN_GROUP_SIZE
    return {
      ...item,
      people: results.length,
      hidden,
      improved: hidden ? 0 : count('improved'),
      unchanged: hidden ? 0 : count('unchanged'),
      worse: hidden ? 0 : count('worse'),
      changed: hidden ? 0 : count('changed'),
      medianPercentChange: hidden
        ? null
        : median(results.map((result) => result.percentChange).filter((value): value is number => value !== null)),
    }
  })
}
