import type { BiomarkerReport } from '@/lib/biomarker-report/schema'
import { STATUS_LABELS } from '@/lib/biomarker-report/format'
import { summarizeReport } from '@/lib/biomarker-report/rules'

/**
 * The report assistant: a clinician of the care team asks a question about one
 * biomarker report, and Claude answers from the report and from medical
 * literature on trusted sites, with a numbered source for each statement
 * (ask.ts calls the API). It answers questions; the clinician decides.
 *
 * This file has no server code, so that the page can build an answer from the
 * same events as the server.
 */

/** The sites the literature search may use: indexes, agencies and journals. Subdomains count too. */
export const LITERATURE_DOMAINS = [
  'nih.gov',
  'fda.gov',
  'cdc.gov',
  'who.int',
  'cochranelibrary.com',
  'nejm.org',
  'thelancet.com',
  'jamanetwork.com',
  'bmj.com',
  'nature.com',
  'ahajournals.org',
  'diabetesjournals.org',
  'acpjournals.org',
  'academic.oup.com',
]

export const MAX_QUESTION_LENGTH = 1000

/** A source of an answer: a quote of the report, or a page of the literature. */
export type AnswerSource =
  | { n: number; kind: 'report'; quote: string }
  | { n: number; kind: 'literature'; title: string; url: string; quote: string }

/** A stretch of the answer's text and the sources that support it. */
export type AnswerSegment = { text: string; sources: number[] }

export type Answer = { segments: AnswerSegment[]; sources: AnswerSource[] }

/** What the server streams to the page while it answers, one JSON object per line. */
export type AnswerEvent =
  | { type: 'status'; text: string }
  | { type: 'segment' }
  | { type: 'text'; text: string }
  | { type: 'source'; source: AnswerSource }
  | { type: 'cite'; n: number }
  | { type: 'done'; questionId: string }
  | { type: 'error'; message: string }

export const emptyAnswer = (): Answer => ({ segments: [], sources: [] })

/** The answer after one more event; the page and the server build the same answer. */
export function applyEvent(answer: Answer, event: AnswerEvent): Answer {
  switch (event.type) {
    case 'segment':
      return { ...answer, segments: [...answer.segments, { text: '', sources: [] }] }
    case 'text': {
      const segments = answer.segments.length > 0 ? answer.segments : [{ text: '', sources: [] }]
      const last = segments.at(-1)!
      return { ...answer, segments: [...segments.slice(0, -1), { ...last, text: last.text + event.text }] }
    }
    case 'source':
      return { ...answer, sources: [...answer.sources, event.source] }
    case 'cite': {
      const last = answer.segments.at(-1)
      if (!last || last.sources.includes(event.n)) return answer
      return { ...answer, segments: [...answer.segments.slice(0, -1), { ...last, sources: [...last.sources, event.n] }] }
    }
    default:
      return answer
  }
}

/** A citation as the API returns it, reduced to what an answer keeps. */
export type Citation = { kind: 'report'; quote: string } | { kind: 'literature'; title: string | null; url: string; quote: string }

/**
 * The events for a citation: its source, the first time an answer uses it,
 * and the citation. A page of the literature is one source; each quote of
 * the report is its own source, so that the clinician sees the line.
 */
export function citationEvents(answer: Answer, citation: Citation): AnswerEvent[] {
  const quote = citation.quote.trim().replace(/\s+/g, ' ')
  const known = answer.sources.find((source) =>
    citation.kind === 'literature' ? source.kind === 'literature' && source.url === citation.url : source.kind === 'report' && source.quote === quote,
  )
  if (known) return [{ type: 'cite', n: known.n }]
  const n = answer.sources.length + 1
  const source: AnswerSource =
    citation.kind === 'literature'
      ? { n, kind: 'literature', title: citation.title?.trim() || new URL(citation.url).hostname, url: citation.url, quote }
      : { n, kind: 'report', quote }
  return [
    { type: 'source', source },
    { type: 'cite', n },
  ]
}

/** A value from the report file, as the file has it. */
const exact = (value: number) => String(value)
/** A value that the report's rules calculate, to 3 significant digits: 18.4, 2.35, 0.00123, 1.23e-10. */
const rounded = (value: number) => String(Number(value.toPrecision(3)))

/**
 * The report as plain text for the model: its numbers and the statuses that
 * the report's own rules give them (lib/biomarker-report/rules.ts), without
 * the person's name or the clinician's, which the answer does not need.
 */
export function reportDocument(report: BiomarkerReport): string {
  const summary = summarizeReport(report)
  const value = (values: (number | null)[], lowerLimit?: number) =>
    values.map((v) => (v === null ? (lowerLimit ? `< ${exact(lowerLimit)}` : 'not measured') : exact(v))).join(', ')
  const lines: string[] = [
    `Report: ${report.title}`,
    ...(report.subtitle ? [report.subtitle] : []),
    `Program: ${report.program.name}${report.program.indication ? ` (${report.program.indication})` : ''}`,
    `Report date: ${report.reportDate}`,
    ...(report.person.age || report.person.sex ? [`Person: ${[report.person.age && `${report.person.age} years`, report.person.sex].filter(Boolean).join(', ')}`] : []),
    ...(report.platform ? [`Platform: ${report.platform}`] : []),
    ...(report.collection ? [`Collection: ${report.collection}`] : []),
    `Timepoints, in order: ${report.timepoints.map((point) => `${point.label} (week ${point.week})`).join('; ')}. Each list of values below follows this order.`,
    `A ${report.markerNoun} counts as changed when it moved at least ${exact(report.threshold)} times the person's own noise (one standard deviation of the person's variation without a real change). "Improved" means it changed in the direction the program intends; "Review" means it changed the other way.`,
  ]
  if (report.dose) {
    lines.push('', `Dose (${report.dose.unit}): ${report.dose.steps.map((step) => `${exact(step.amount)} from week ${step.week}`).join('; ')}.${report.dose.note ? ` ${report.dose.note}` : ''}`)
  }
  if (report.effects.length > 0) {
    lines.push('', 'Effects the person reported:', ...report.effects.map((effect) => `- Weeks ${effect.weeks}: ${effect.text} (${effect.severity})`))
  }
  if (summary.clinicalValues.length > 0) {
    lines.push('', 'Clinical laboratory values:')
    for (const item of summary.clinicalValues) {
      const change = item.percentChange === null ? '' : `, change ${item.percentChange > 0 ? '+' : ''}${rounded(item.percentChange)}%`
      lines.push(
        `- ${item.name} (${item.unit}): ${value(item.values, item.lowerLimit)}${item.reference ? `; reference ${item.reference}` : ''}${change}; status ${STATUS_LABELS[item.status]}${item.note ? `. ${item.note}` : ''}`,
      )
    }
    for (const note of report.clinicalNotes) lines.push(`Note, ${note.lead} ${note.text}`)
  }
  for (const panel of summary.panels) {
    lines.push('', `Panel: ${panel.name}.${panel.summary ? ` ${panel.summary}` : ''}`)
    for (const marker of panel.markers) {
      const moved = marker.noiseMultiple === null ? '' : `, change ${rounded(marker.noiseMultiple)} times the noise`
      lines.push(
        `- ${marker.name} (${marker.id}, ${marker.unit}): ${value(marker.values, marker.lowerLimit)}; noise ${exact(marker.noise)}; intended ${marker.intended}${moved}; status ${STATUS_LABELS[marker.status]}${marker.note ? `. ${marker.note}` : ''}`,
      )
    }
  }
  if (report.movers) {
    lines.push('', `Other ${report.markerNoun}s that moved, outside the panels (exploratory). ${report.movers.intro}`)
    for (const mover of report.movers.items) {
      lines.push(`- ${mover.name} (${mover.id}): ${mover.percentChange > 0 ? '+' : ''}${exact(mover.percentChange)}%, ${exact(mover.noiseMultiple)} times the noise`)
    }
  }
  if (report.panelNote) lines.push('', report.panelNote)
  if (report.disclaimer) lines.push('', report.disclaimer)
  return lines.join('\n')
}

/** What the assistant tells the model about its job. Fixed text, so that the cache can reuse it. */
export const ASSISTANT_INSTRUCTIONS = `You answer questions from the clinicians of a care team about one patient's biomarker report. The report is the attached document.

Answer like a careful clinical colleague:
- Base every statement about this patient on the report, and cite the report for it.
- For background, such as what a marker does, what a drug is known to do or what studies found, search the medical literature and cite the sources.
- Say plainly when the report or the literature does not answer the question, or when the evidence is weak or mixed. Do not guess.
- A change after the start of a program does not prove that the program caused it.
- Do not make the treatment decision. Give the clinician what they need to decide.
- Give the direct answer first, then the reasons. Keep it short: at most about 200 words. Write plain sentences in short paragraphs, without Markdown, headings or tables.`
