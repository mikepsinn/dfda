import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BiomarkerReportView } from "@/components/biomarker-report/BiomarkerReportView"
import { SignOffForm } from "@/components/care-team/CareForms"
import { ReportAssistant } from "@/components/care-team/ReportAssistant"
import { ReviewStatus } from "@/components/care-team/ReviewStatus"
import { removeReportAction, signOffReportAction } from "@/lib/actions/care-team"
import { assistantAvailable, questionsAbout } from "@/lib/care-team/ask"
import { findReport, requireCarePatient, requireCareTeam } from "@/lib/care-team/data"
import { formatDate } from "@/lib/programs/format"

export const metadata: Metadata = { title: "Review a report" }

const messages: Record<string, string> = {
  added: "The report is saved. The person can see it now.",
  signed: "Signed off. The person sees your name, the date and your note; the decision is for the care team.",
}

/** A shared report for the care team: its review, the report, the report assistant, then the sign-off. */
export default async function CareReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; enrollment: string; report: string }>
  searchParams: Promise<{ added?: string; signed?: string; error?: string }>
}) {
  const [{ slug, enrollment, report: reportId }, query] = await Promise.all([params, searchParams])
  const { user, instance } = await requireCareTeam(slug)
  const patient = await requireCarePatient(user, instance, enrollment)
  const saved = await findReport(user, reportId)
  if (!saved || saved.userId !== patient.userId || saved.programId !== patient.program.id) notFound()
  const message = query.signed ? messages.signed : query.added ? messages.added : null
  const questions = (await assistantAvailable(patient.program.instanceId, patient.userId)) ? await questionsAbout(user, saved.id) : null

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/instances/${instance.slug}/care/${patient.enrollmentId}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary underline print:hidden"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {patient.name}
      </Link>

      {message && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary print:hidden">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> {message}
        </p>
      )}
      {query.error === "remove" && (
        <p role="alert" className="text-sm font-medium text-destructive print:hidden">
          Only a report that nobody has signed off yet can be removed.
        </p>
      )}

      <BiomarkerReportView report={saved.report} brandName={instance.name} review={<ReviewStatus report={saved} audience="care-team" />} />

      {questions && (
        <ReportAssistant
          reportId={saved.id}
          initial={questions.map((item) => ({
            id: item.id,
            question: item.question,
            askerName: item.askerName,
            askedOn: formatDate(item.createdAt),
            answer: item.answer,
          }))}
        />
      )}

      {!saved.reviewedAt && (
        <section aria-labelledby="sign-off-heading" className="surface-raised mx-auto max-w-5xl space-y-4 rounded-xl border p-6 print:hidden">
          <h2 id="sign-off-heading" className="text-xl font-semibold">Sign off</h2>
          <p className="text-sm text-muted-foreground">
            Your sign-off shows your name, the date and your note to {patient.name}. The decision is for the care team
            only.
          </p>
          <SignOffForm action={signOffReportAction.bind(null, instance.slug, patient.enrollmentId, saved.id)} />
          <form action={removeReportAction.bind(null, instance.slug, patient.enrollmentId, saved.id)} className="border-t pt-4">
            <Button type="submit" variant="outline" size="sm">
              Remove this report
            </Button>
          </form>
        </section>
      )}
    </div>
  )
}
