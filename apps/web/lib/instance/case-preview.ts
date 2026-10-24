import { caseMarkers, caseTimeline, draftNote, headlineMarkers, type CaseMarker, type CaseTimeline } from '@/lib/care-team/case'
import { demoPatientReport, demoPatientValues } from '@/lib/demo/clinic'
import type { Program } from '@/lib/programs/data'

/**
 * The case that a clinic's home page shows (components/instance/ClinicHome.tsx):
 * the demo patient of the site's demo (lib/demo/instance.ts) in the first
 * program with care team review, as the care team sees it. Made from the demo's
 * values and report, so that the page needs no account and reads nobody's data.
 * Server only.
 */
export type CasePreview = {
  patientName: string
  details: string | null
  programName: string
  startedAt: Date
  followUpWeeks: number
  timeline: CaseTimeline
  /** The largest changes, as on the case page. */
  headline: CaseMarker[]
  measured: string
  collection: string | null
  firstLabel: string
  lastLabel: string
  note: string
}

/** The preview for a site whose programs include one with care team review; null for any other site. */
export function casePreview(instanceName: string, programs: Program[], now = new Date()): CasePreview | null {
  const program = programs.find((candidate) => candidate.careTeamReview)
  if (!program) return null
  const { startedAt, series } = demoPatientValues(program, now)
  const report = demoPatientReport(program, startedAt, instanceName)
  const markers = caseMarkers(report)
  return {
    patientName: report.person.name,
    details: [report.person.age !== undefined ? `${report.person.age} years` : null, report.person.sex ?? null].filter(Boolean).join(' · ') || null,
    programName: program.name,
    startedAt,
    followUpWeeks: program.followUpWeeks,
    timeline: caseTimeline({ program, startedAt, series, report }),
    headline: headlineMarkers(markers),
    measured: `${(report.assayCount ?? markers.length).toLocaleString('en-US')} ${report.markerNoun}s measured`,
    collection: report.collection ?? null,
    firstLabel: report.timepoints[0].label,
    lastLabel: report.timepoints.at(-1)?.label ?? `Week ${program.followUpWeeks}`,
    note: draftNote(markers),
  }
}
