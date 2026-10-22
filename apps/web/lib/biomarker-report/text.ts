import { formatPercent } from '@/lib/programs/format'
import { formatMultiple } from './format'
import { summarizeReport, type MarkerStatus, type PanelVerdict, type ReportSummary } from './rules'
import type { BiomarkerReport } from './schema'

/**
 * The texts that a report file may leave out, written from the file's own
 * numbers (rules.ts): each panel's summary and the text of each card on the
 * summary page. Facts only, in fixed sentences: what moved, how far and in
 * which direction. Advice is for the clinic to write in the file.
 */

type PanelResult = ReportSummary['panels'][number]
type MarkerResult = PanelResult['markers'][number]

/** How many markers a sentence names. */
const NAMED = 3

const VERDICTS: PanelVerdict[] = ['intended', 'unchanged', 'review']

const counted = (count: number, noun: string) => `${count} ${count === 1 ? noun : `${noun}s`}`

/** "IGFBP1 +95% (5.9×)" */
function change(marker: MarkerResult) {
  const percent = marker.percentChange === null ? '' : ` ${formatPercent(marker.percentChange)}`
  return `${marker.id}${percent} (${formatMultiple(marker.noiseMultiple ?? 0)})`
}

/** The markers with a status, largest change in multiples of the noise first. */
function largest(markers: MarkerResult[], status: MarkerStatus) {
  return markers.filter((marker) => marker.status === status).sort((a, b) => (b.noiseMultiple ?? 0) - (a.noiseMultiple ?? 0))
}

/** The first NAMED markers, as "A +95% (5.9×), B −40% (3.6×)". */
const named = (markers: MarkerResult[]) => markers.slice(0, NAMED).map(change).join(', ')

/** "lead: A, B." or, when there are more than NAMED markers, "lead; the largest: A, B, C." */
const naming = (lead: string, markers: MarkerResult[]) => `${lead}${markers.length > NAMED ? '; the largest' : ''}: ${named(markers)}.`

/** A panel's summary: its counts, and the markers that moved furthest. */
export function panelSummary(panel: PanelResult, noun: string): string {
  const { counts } = panel
  const total = panel.markers.length
  const sentences: string[] = []
  if (counts.review > 0) {
    sentences.push(
      naming(`${counts.review} of ${total} ${noun}s moved beyond this patient's noise against the intended direction`, largest(panel.markers, 'review')),
    )
    if (counts.intended > 0) sentences.push(`${counted(counts.intended, noun)} moved in the intended direction.`)
  } else if (counts.intended > 0) {
    sentences.push(`${counts.intended} of ${total} ${noun}s moved beyond this patient's noise in the intended direction, and none moved the other way.`)
    sentences.push(`${counts.intended > NAMED ? 'The largest changes' : 'The changes'}: ${named(largest(panel.markers, 'intended'))}.`)
  } else {
    sentences.push(`No ${noun} in this panel moved beyond this patient's own noise.`)
  }
  // A marker without a first or last value: below the assay's limit when the file gives the limit, else not measured.
  const withoutChange = panel.markers.filter((marker) => marker.status === 'below-limit')
  const belowLimit = withoutChange.filter((marker) => marker.lowerLimit !== undefined).length
  const noValue = withoutChange.length - belowLimit
  if (belowLimit > 0) sentences.push(`${counted(belowLimit, noun)} ${belowLimit === 1 ? 'was' : 'were'} below the assay's limit, so ${belowLimit === 1 ? 'it has' : 'they have'} no change.`)
  if (noValue > 0) sentences.push(`${counted(noValue, noun)} had no value at the first or the last timepoint, so ${noValue === 1 ? 'it has' : 'they have'} no change.`)
  return sentences.join(' ')
}

/** The text of the summary page's card for the panels with one verdict. */
export function verdictText(verdict: PanelVerdict, panels: PanelResult[], noun: string): string {
  const markers = panels.flatMap((panel) => panel.markers)
  if (verdict === 'unchanged') return `No ${noun} in these panels moved beyond this patient's own noise.`
  if (verdict === 'intended') {
    const moved = markers.filter((marker) => marker.status === 'intended').length
    return `${moved} of ${markers.length} ${noun}s in these panels moved beyond this patient's noise in the intended direction, and none moved the other way.`
  }
  const against = largest(markers, 'review')
  return naming(`${counted(against.length, noun)} moved beyond this patient's noise against the intended direction`, against)
}

/** The report with each text that its file leaves out written from its numbers; texts that the file gives stay as they are. */
export function withGeneratedText(report: BiomarkerReport): BiomarkerReport {
  const summary = summarizeReport(report)
  const noun = report.markerNoun
  const glance = { ...report.glance }
  for (const verdict of VERDICTS) {
    const panels = summary.panels.filter((panel) => panel.verdict === verdict)
    if (!glance[verdict] && panels.length > 0) glance[verdict] = verdictText(verdict, panels, noun)
  }
  return {
    ...report,
    panels: report.panels.map((panel, index) => (panel.summary ? panel : { ...panel, summary: panelSummary(summary.panels[index], noun) })),
    glance,
  }
}
