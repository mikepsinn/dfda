import type { BiomarkerReport, ClinicalValue, Marker, Panel } from './schema'

/**
 * The rules of a biomarker report. Pure functions: every status, count and
 * index comes from the values in the data file (schema.ts).
 *
 * - A marker compares its first and its last timepoint. Its noise multiple is
 *   the size of the change divided by the person's own noise for that marker.
 * - Below the report's threshold (1.5× by default) the marker is unchanged.
 *   Above it, a change in the intended direction is "intended"; a change the
 *   other way is "review".
 * - A panel's index is the mean noise multiple of its markers, signed so that
 *   a change in the intended direction counts as positive. It compares a
 *   person with themselves only, never with other people.
 * - A clinical value counts as changed from its meaningful change in percent.
 */

export type MarkerStatus = 'intended' | 'unchanged' | 'review' | 'below-limit'
export type ClinicalStatus = MarkerStatus | 'changed'
export type PanelVerdict = 'intended' | 'unchanged' | 'review'

export type Change = {
  first: number | null
  last: number | null
  change: number | null
  /** Change in percent of the first value; null when the first value is 0 or missing. */
  percentChange: number | null
}

export type MarkerResult = Change & {
  /** |change| ÷ noise. */
  noiseMultiple: number | null
  /** The noise multiple, positive for a change in the intended direction and negative for a change the other way. */
  score: number | null
  status: MarkerStatus
}

export type PanelResult = {
  markers: (Marker & MarkerResult)[]
  /** Mean score of the markers with values; null when no marker has values. */
  index: number | null
  counts: Record<MarkerStatus, number>
  verdict: PanelVerdict
}

export type ClinicalResult = Change & { status: ClinicalStatus }

export type ReportSummary = {
  panels: (Omit<Panel, 'markers'> & PanelResult)[]
  clinicalValues: (ClinicalValue & ClinicalResult)[]
  counts: Record<MarkerStatus, number> & { total: number }
}

/** Floating-point slack for the threshold checks: 1.15 − 1 is 0.1499999999999999, which must count as 0.15. */
const TOLERANCE = 1e-9

function compare(values: (number | null)[]): Change {
  const first = values[0] ?? null
  const last = values.at(-1) ?? null
  if (first === null || last === null) return { first, last, change: null, percentChange: null }
  const change = last - first
  return { first, last, change, percentChange: first === 0 ? null : (change / Math.abs(first)) * 100 }
}

export function markerResult(marker: Marker, threshold: number): MarkerResult {
  const compared = compare(marker.values)
  if (compared.change === null) return { ...compared, noiseMultiple: null, score: null, status: 'below-limit' }

  const noiseMultiple = Math.abs(compared.change) / marker.noise
  const towardIntended = compared.change > 0 === (marker.intended === 'up')
  const score = compared.change === 0 ? 0 : towardIntended ? noiseMultiple : -noiseMultiple
  let status: MarkerStatus
  if (noiseMultiple < threshold - TOLERANCE) status = 'unchanged'
  else status = towardIntended ? 'intended' : 'review'
  return { ...compared, noiseMultiple, score, status }
}

const noCounts = (): Record<MarkerStatus, number> => ({ intended: 0, unchanged: 0, review: 0, 'below-limit': 0 })

/** One "review" marker makes the panel one to review; otherwise any "intended" marker makes it intended. */
export function panelVerdict(counts: Record<MarkerStatus, number>): PanelVerdict {
  if (counts.review > 0) return 'review'
  if (counts.intended > 0) return 'intended'
  return 'unchanged'
}

export function panelResult(panel: Panel, threshold: number): PanelResult {
  const markers = panel.markers.map((marker) => ({ ...marker, ...markerResult(marker, threshold) }))
  const counts = noCounts()
  for (const marker of markers) counts[marker.status]++
  const scores = markers.flatMap((marker) => (marker.score === null ? [] : [marker.score]))
  const index = scores.length === 0 ? null : scores.reduce((sum, score) => sum + score, 0) / scores.length
  return { markers, index, counts, verdict: panelVerdict(counts) }
}

export function clinicalResult(value: ClinicalValue): ClinicalResult {
  const compared = compare(value.values)
  if (compared.change === null) return { ...compared, status: 'below-limit' }
  // A first value of 0 has no percent change; any change from it counts.
  const meaningful = compared.percentChange === null ? compared.change !== 0 : Math.abs(compared.percentChange) >= value.meaningfulChange - TOLERANCE
  let status: ClinicalStatus
  if (!meaningful) status = 'unchanged'
  else if (value.better === 'neither') status = 'changed'
  else status = compared.change > 0 === (value.better === 'higher') ? 'intended' : 'review'
  return { ...compared, status }
}

export function summarizeReport(report: BiomarkerReport): ReportSummary {
  const panels = report.panels.map((panel) => ({ ...panel, ...panelResult(panel, report.threshold) }))
  const counts = { ...noCounts(), total: 0 }
  for (const panel of panels) {
    for (const status of Object.keys(panel.counts) as MarkerStatus[]) counts[status] += panel.counts[status]
    counts.total += panel.markers.length
  }
  return {
    panels,
    clinicalValues: report.clinicalValues.map((value) => ({ ...value, ...clinicalResult(value) })),
    counts,
  }
}
