import type { BiomarkerReport, Marker } from '@/lib/biomarker-report/schema'
import { summarizeReport, type MarkerResult } from '@/lib/biomarker-report/rules'
import type { Program } from '@/lib/programs/data'
import type { Point } from '@/lib/programs/report'

/**
 * The care team's case page (app/(protected)/instances/[slug]/care/[enrollment]):
 * one person's program in four chapters, Baseline, Track, Follow-up and
 * Decide. Pure functions; the page passes in the report and the person's logs.
 */

export type CaseMarker = Marker & MarkerResult & { panelId: string; panelName: string; key: string }

/** Every marker of the report's panels, with its result and the key that selects it on the page. */
export function caseMarkers(report: BiomarkerReport): CaseMarker[] {
  return summarizeReport(report).panels.flatMap((panel) =>
    panel.markers.map((marker) => ({ ...marker, panelId: panel.id, panelName: panel.name, key: `${panel.id}.${marker.id}` })),
  )
}

const moved = (marker: CaseMarker) => (marker.status === 'intended' || marker.status === 'review') && marker.noiseMultiple !== null

/**
 * The markers for the cards at the top of Follow-up: the largest change of
 * each panel beyond the person's noise, largest first, with the largest
 * change to review always among them.
 */
export function headlineMarkers(markers: CaseMarker[], count = 4): CaseMarker[] {
  const best = new Map<string, CaseMarker>()
  for (const marker of markers.filter(moved)) {
    const current = best.get(marker.panelId)
    if (!current || marker.noiseMultiple! > current.noiseMultiple!) best.set(marker.panelId, marker)
  }
  const chosen = [...best.values()].sort((a, b) => b.noiseMultiple! - a.noiseMultiple!).slice(0, count)
  const review = markers.filter((marker) => marker.status === 'review').sort((a, b) => b.noiseMultiple! - a.noiseMultiple!)[0]
  if (review && !chosen.includes(review)) chosen.splice(Math.min(chosen.length, count - 1), 1, review)
  return chosen
}

const shortName = (marker: CaseMarker) => (marker.name.length <= 32 ? marker.name : marker.id)

/** "a, b and 3 more". */
function listOf(names: string[], shown = 3): string {
  const head = names.slice(0, shown)
  const rest = names.length - head.length
  if (rest > 0) return `${head.join(', ')} and ${rest} more`
  return head.length > 1 ? `${head.slice(0, -1).join(', ')} and ${head.at(-1)}` : head[0]
}

/**
 * A first draft of the clinician's note to the person, from the report's
 * statuses: facts only, no advice. The clinician edits it and adds the plan
 * before they sign off.
 */
export function draftNote(markers: CaseMarker[]): string {
  const byChange = (status: CaseMarker['status']) =>
    markers.filter((marker) => marker.status === status).sort((a, b) => (b.noiseMultiple ?? 0) - (a.noiseMultiple ?? 0))
  const intended = byChange('intended')
  const review = byChange('review')
  const unchanged = byChange('unchanged')
  const lines: string[] = []
  if (intended.length) lines.push(`Since your baseline, these moved the way the program intends: ${listOf(intended.map(shortName))}.`)
  if (review.length) lines.push(`These moved the other way, and we will look at them together: ${listOf(review.map(shortName), 4)}.`)
  if (unchanged.length) lines.push(`${unchanged.length} other markers stayed within your normal variation.`)
  return lines.join('\n')
}

export type TimelineLane =
  | { kind: 'steps'; name: string; unit: string; steps: { from: number; to: number; amount: number }[] }
  | { kind: 'points'; name: string; unit: string; points: { week: number; value: number }[] }
  | { kind: 'spans'; name: string; spans: { from: number; to: number; text: string; severity: 'mild' | 'notable' | 'resolved' }[] }

/** Weeks since the start of the program: the samples, and one lane for each thing that the person logged. */
export type CaseTimeline = { start: number; end: number; samples: { week: number; label: string }[]; lanes: TimelineLane[] }

const WEEK = 7 * 86_400_000

/** "Wk 3–6" → weeks 2 to 6 (week 3 starts after two whole weeks); null when it does not read as a week range. */
function parseWeeks(text: string): { from: number; to: number } | null {
  const numbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number)
  if (!numbers?.length) return null
  return { from: numbers[0] - 1, to: numbers.at(-1)! }
}

/** Steps of the dose: a step starts where the amount changes and lasts until the next one, or to `end`. */
function doseSteps(points: { week: number; amount: number }[], end: number) {
  const starts = points.filter((point, index) => index === 0 || point.amount !== points[index - 1].amount)
  return starts.map((point, index) => ({ from: point.week, to: starts[index + 1]?.week ?? end, amount: point.amount }))
}

/**
 * The timeline of the Track chapter. The dose comes from the person's logs, or
 * from the report when they logged none; check-ins and lab values are points,
 * never joined into a curve; the report's reported effects are spans. Logs
 * from more than two weeks before the start are left out.
 */
export function caseTimeline({
  program,
  startedAt,
  series,
  report,
}: {
  program: Pick<Program, 'items' | 'followUpWeeks'>
  startedAt: Date
  series: Map<string, Point[]>
  report: BiomarkerReport | null
}): CaseTimeline {
  const weekOf = (at: Date) => (at.getTime() - startedAt.getTime()) / WEEK
  const samples = report?.timepoints.map((timepoint) => ({ week: timepoint.week, label: timepoint.label })) ?? []
  const logged = [...series.values()].flat().map((point) => weekOf(point.at))
  const start = Math.max(-2, Math.floor(Math.min(0, ...logged)))
  const end = Math.ceil(Math.max(program.followUpWeeks, ...samples.map((sample) => sample.week), ...logged))
  const inRange = (points: Point[]) => points.map((point) => ({ week: weekOf(point.at), value: point.value })).filter((point) => point.week >= start)

  const lanes: TimelineLane[] = []
  for (const item of program.items.filter((candidate) => candidate.kind === 'dose')) {
    const points = inRange(series.get(item.variableId) ?? []).map((point) => ({ week: point.week, amount: point.value }))
    if (points.length) lanes.push({ kind: 'steps', name: item.name, unit: item.unit, steps: doseSteps(points, end) })
  }
  if (!lanes.length && report?.dose) {
    const name = program.items.find((item) => item.kind === 'dose')?.name ?? 'Dose'
    lanes.push({
      kind: 'steps',
      name,
      unit: report.dose.unit,
      steps: doseSteps(report.dose.steps.map((step) => ({ week: step.week, amount: step.amount })), end),
    })
  }
  for (const kind of ['check_in', 'lab'] as const) {
    for (const item of program.items.filter((candidate) => candidate.kind === kind)) {
      const points = inRange(series.get(item.variableId) ?? [])
      if (points.length) lanes.push({ kind: 'points', name: item.name, unit: item.unit, points })
    }
  }
  const spans = (report?.effects ?? []).flatMap((effect) => {
    const weeks = parseWeeks(effect.weeks)
    return weeks ? [{ ...weeks, text: effect.text, severity: effect.severity }] : []
  })
  if (spans.length) lanes.push({ kind: 'spans', name: 'Reported effects', spans })
  return { start, end, samples, lanes }
}
