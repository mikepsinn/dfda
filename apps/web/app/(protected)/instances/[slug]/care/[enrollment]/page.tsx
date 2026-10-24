import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, FileText } from "lucide-react"
import { UploadReportForm } from "@/components/care-team/CareForms"
import { ReportAssistant } from "@/components/care-team/ReportAssistant"
import { ReportList } from "@/components/care-team/ReportList"
import { ReviewStatus } from "@/components/care-team/ReviewStatus"
import { ArcTimeline, dateAtWeek, PatientCard, SampleCard } from "@/components/care-team/case/Baseline"
import { CaseSignOff } from "@/components/care-team/case/CaseSignOff"
import { ChapterBar } from "@/components/care-team/case/ChapterBar"
import { MarkerCard, MarkerDetail, PathwayGrid } from "@/components/care-team/case/FollowUp"
import { CaseCard, Eyebrow, SERIF } from "@/components/care-team/case/parts"
import { TrackLanes } from "@/components/care-team/case/TrackLanes"
import { signOffReportAction, uploadReportAction } from "@/lib/actions/care-team"
import { summarizeReport } from "@/lib/biomarker-report/rules"
import { assistantAvailable, questionsAbout } from "@/lib/care-team/ask"
import { caseMarkers, caseTimeline, draftNote, headlineMarkers, type CaseMarker } from "@/lib/care-team/case"
import { careLogs, findReport, requireCarePatient, requireCareTeam } from "@/lib/care-team/data"
import { drugClassOf, evidenceFor } from "@/lib/care-team/evidence"
import { programWeek } from "@/lib/care-team/format"
import { formatDate } from "@/lib/programs/format"

export const metadata: Metadata = { title: "Patient" }

const chapter = "scroll-mt-32 space-y-4"

/**
 * One person who shares their reports with the care team, as a case in four
 * chapters: Baseline (who, when, the first sample), Track (what they logged,
 * with the samples), Follow-up (the latest report by pathway, one marker at a
 * time with its sources) and Decide (questions, the note and the sign-off).
 */
export default async function CarePatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; enrollment: string }>
  searchParams: Promise<{ removed?: string; signed?: string; marker?: string }>
}) {
  const [{ slug, enrollment }, query] = await Promise.all([params, searchParams])
  const { user, instance } = await requireCareTeam(slug)
  const patient = await requireCarePatient(user, instance, enrollment)
  const base = `/instances/${instance.slug}/care/${patient.enrollmentId}`
  const latest = patient.reports[0] ? await findReport(user, patient.reports[0].id) : null
  const report = latest?.report ?? null
  const [logs, questions] = await Promise.all([
    careLogs(patient),
    latest && assistantAvailable(patient.program.instanceId) ? questionsAbout(user, latest.id) : null,
  ])

  const timeline = caseTimeline({ program: patient.program, startedAt: patient.startedAt, series: logs, report })
  const markers = report ? caseMarkers(report) : []
  const panels = report
    ? summarizeReport(report).panels.map((panel) => ({ ...panel, markers: markers.filter((marker) => marker.panelId === panel.id) }))
    : []
  const headline = headlineMarkers(markers)
  const selected = markers.find((marker) => marker.key === query.marker) ?? headline[0] ?? markers[0] ?? null
  const drugClass = drugClassOf(patient.program)
  const hrefFor = (marker: CaseMarker) => `${base}?marker=${encodeURIComponent(marker.key)}#marker`
  const lastTimepoint = report?.timepoints.at(-1)
  const details = [report?.person.age !== undefined ? `${report.person.age} years` : null, report?.person.sex ?? null].filter(Boolean).join(" · ")

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="space-y-3">
        <Link href={`/instances/${instance.slug}/care`} className="inline-flex items-center gap-1 text-sm font-medium text-primary underline">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Patients
        </Link>
        <ChapterBar />
        {query.removed && (
          <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> The report is removed.
          </p>
        )}
      </div>

      <section id="baseline" aria-label="Baseline" className={chapter}>
        <div className="grid gap-4 lg:grid-cols-[22rem_1fr]">
          <PatientCard
            name={patient.name}
            details={details || null}
            programName={patient.program.name}
            rows={[
              { term: "Baseline", value: `${formatDate(patient.startedAt)} · Day 0` },
              {
                term: "Follow-up",
                value: lastTimepoint
                  ? `${formatDate(dateAtWeek(patient.startedAt, lastTimepoint.week))} · ${lastTimepoint.label}`
                  : `${formatDate(dateAtWeek(patient.startedAt, patient.program.followUpWeeks))} · Week ${patient.program.followUpWeeks}`,
              },
              { term: "Now", value: programWeek(patient.startedAt, patient.program.followUpWeeks) },
              { term: "Shares since", value: formatDate(patient.sharedAt) },
            ]}
          />
          <ArcTimeline startedAt={patient.startedAt} samples={timeline.samples} followUpWeek={patient.program.followUpWeeks} end={timeline.end} />
          {report && (
            <div className="lg:col-span-2">
              <SampleCard
                measured={`${(report.assayCount ?? markers.length).toLocaleString("en-US")} ${report.markerNoun}s measured`}
                collection={report.collection ?? null}
                firstLabel={report.timepoints[0].label}
              />
            </div>
          )}
        </div>
      </section>

      <section id="track" aria-labelledby="track-heading" className={chapter}>
        <CaseCard className="space-y-4">
          <div className="space-y-1">
            <Eyebrow>Track</Eyebrow>
            <h2 id="track-heading" className={`${SERIF} text-2xl`}>
              What surrounded the change
            </h2>
            <p className="text-sm text-muted-foreground">
              {patient.program.careTeamReview
                ? `The dose, check-ins and lab values as ${patient.name} logged them, on the same weeks as the samples.`
                : "In this program the care team sees the reports only, so the timeline shows what the report holds."}
            </p>
          </div>
          {timeline.lanes.length ? <TrackLanes timeline={timeline} /> : <p className="text-sm text-muted-foreground">Nothing logged yet.</p>}
        </CaseCard>
      </section>

      <section id="follow-up" aria-labelledby="follow-up-heading" className={chapter}>
        <div className="space-y-1">
          <Eyebrow>Follow-up{lastTimepoint ? ` · ${lastTimepoint.label}` : ""}</Eyebrow>
          <h2 id="follow-up-heading" className={`${SERIF} text-2xl`}>
            {report ? "Grouped by pathway, not a single score" : "No report yet"}
          </h2>
        </div>
        {report && latest && selected ? (
          <>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Largest changes">
              {headline.map((marker) => (
                <li key={marker.key}>
                  <MarkerCard marker={marker} href={hrefFor(marker)} selected={marker.key === selected.key} />
                </li>
              ))}
            </ul>
            <PathwayGrid panels={panels} hrefFor={hrefFor} selectedKey={selected.key} />
            <MarkerDetail
              marker={selected}
              report={report}
              evidence={evidenceFor(drugClass, selected.id)}
              siblings={markers.filter((marker) => marker.panelId === selected.panelId && marker.key !== selected.key).slice(0, 6)}
              hrefFor={hrefFor}
            />
            <Link href={`${base}/reports/${latest.id}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline">
              <FileText aria-hidden="true" className="h-4 w-4" /> Open the full report, with every panel and the print view
            </Link>
          </>
        ) : (
          <CaseCard className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Add the first report file below, or connect the laboratory with an import key. {patient.name} sees each report as soon as it is saved.
            </p>
          </CaseCard>
        )}
      </section>

      <section id="decide" aria-labelledby="decide-heading" className={chapter}>
        <div className="space-y-1">
          <Eyebrow>Decide</Eyebrow>
          <h2 id="decide-heading" className={`${SERIF} text-2xl`}>
            You review. You edit. You decide.
          </h2>
        </div>
        {query.signed && (
          <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> Signed off. {patient.name} sees your name, the date and your note.
          </p>
        )}
        {latest && latest.reviewedAt && <ReviewStatus report={latest} audience="care-team" />}
        {latest && !latest.reviewedAt && (
          <>
            {questions && (
              <ReportAssistant
                reportId={latest.id}
                initial={questions.map((item) => ({
                  id: item.id,
                  question: item.question,
                  askerName: item.askerName,
                  askedOn: formatDate(item.createdAt),
                  answer: item.answer,
                }))}
              />
            )}
            <CaseCard>
              <CaseSignOff
                action={signOffReportAction.bind(null, instance.slug, patient.enrollmentId, latest.id)}
                draft={draftNote(markers)}
                title={`${patient.name} · ${lastTimepoint?.label ?? "Report"}`}
              />
            </CaseCard>
          </>
        )}
        {patient.reports.length > 1 && (
          <div className="space-y-2">
            <h3 className="font-semibold">All reports</h3>
            <ReportList reports={patient.reports} hrefFor={(id) => `${base}/reports/${id}`} audience="care-team" className="surface-raised" />
          </div>
        )}
        <details className="surface-raised rounded-3xl border bg-card p-5 sm:p-6" open={!report}>
          <summary className="cursor-pointer font-semibold">Add a report</summary>
          <div className="mt-3 space-y-3">
            <p className="text-sm text-muted-foreground">
              A report file from your lab, in the biomarker report format (JSON; see the{" "}
              <a href="/reports/example.json" className="font-medium text-primary underline">
                example file
              </a>
              ). The file is checked before it is saved. {patient.name} sees the report at once, marked as waiting for review.
            </p>
            <UploadReportForm action={uploadReportAction.bind(null, instance.slug, patient.enrollmentId)} />
          </div>
        </details>
      </section>
    </div>
  )
}
