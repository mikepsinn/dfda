import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { ReportList } from "@/components/care-team/ReportList"
import { UploadReportForm } from "@/components/care-team/CareForms"
import { uploadReportAction } from "@/lib/actions/care-team"
import { requireCarePatient, requireCareTeam } from "@/lib/care-team/data"
import { programWeek } from "@/lib/care-team/format"
import { formatDate } from "@/lib/programs/format"

export const metadata: Metadata = { title: "Patient" }

/** One person who shares their reports with the care team: their program and reports, and a new report. */
export default async function CarePatientPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; enrollment: string }>
  searchParams: Promise<{ removed?: string }>
}) {
  const [{ slug, enrollment }, query] = await Promise.all([params, searchParams])
  const { user, instance } = await requireCareTeam(slug)
  const patient = await requireCarePatient(user, instance, enrollment)
  const base = `/instances/${instance.slug}/care/${patient.enrollmentId}`

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link href={`/instances/${instance.slug}/care`} className="inline-flex items-center gap-1 text-sm font-medium text-primary underline">
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Patients
      </Link>

      <header className="space-y-3">
        <p className="text-sm font-medium text-primary">{instance.name} care team</p>
        <h1 className="text-3xl font-bold tracking-tight">{patient.name}</h1>
        <dl className="surface-raised grid gap-4 rounded-xl border bg-card p-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Program</dt>
            <dd className="mt-0.5">{patient.program.name}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Started</dt>
            <dd className="mt-0.5">
              {formatDate(patient.startedAt)} · {programWeek(patient.startedAt, patient.program.followUpWeeks)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Shares reports since</dt>
            <dd className="mt-0.5">{formatDate(patient.sharedAt)}</dd>
          </div>
        </dl>
      </header>

      <section aria-labelledby="reports-heading" className="space-y-3">
        <h2 id="reports-heading" className="text-xl font-semibold">Biomarker reports</h2>
        {query.removed && (
          <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> The report is removed.
          </p>
        )}
        {patient.reports.length > 0 ? (
          <ReportList reports={patient.reports} hrefFor={(id) => `${base}/reports/${id}`} audience="care-team" className="surface-raised" />
        ) : (
          <p className="text-muted-foreground">No report yet.</p>
        )}
      </section>

      <section aria-labelledby="add-heading" className="surface-raised space-y-3 rounded-xl border p-6">
        <h2 id="add-heading" className="text-xl font-semibold">Add a report</h2>
        <p className="text-sm text-muted-foreground">
          A report file from your lab, in the biomarker report format (JSON; see the{" "}
          <a href="/reports/example.json" className="font-medium text-primary underline">
            example file
          </a>
          ). The file is checked before it is saved. {patient.name} sees the report at once, marked as waiting for review.
        </p>
        <UploadReportForm action={uploadReportAction.bind(null, instance.slug, patient.enrollmentId)} />
      </section>
    </div>
  )
}
