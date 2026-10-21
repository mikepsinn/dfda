import { CheckCircle2, Clock } from "lucide-react"
import type { ReportSummary } from "@/lib/care-team/data"
import { formatDate } from "@/lib/programs/format"

/**
 * Whether a clinician has signed off a biomarker report: who, when and their
 * note, or that the report waits for review. The person sees the report
 * before the review too.
 */
export function ReviewStatus({ report, audience }: { report: ReportSummary; audience: "patient" | "care-team" }) {
  if (report.reviewedAt) {
    return (
      <section aria-label="Review" className="surface-raised flex items-start gap-3 rounded-xl border bg-card p-4 break-inside-avoid">
        <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-medium">
            Reviewed by {report.reviewerName} on {formatDate(report.reviewedAt)}
          </p>
          {report.reviewNote && <p className="whitespace-pre-line text-sm">{report.reviewNote}</p>}
        </div>
      </section>
    )
  }
  return (
    <section aria-label="Review" className="flex items-start gap-3 rounded-xl border border-dashed p-4 break-inside-avoid">
      <Clock aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
      <div className="space-y-1">
        <p className="font-medium">Waiting for review</p>
        <p className="text-sm text-muted-foreground">
          {audience === "patient"
            ? "Nobody on the care team has reviewed this report yet. You see it as soon as the clinic saves it."
            : "Nobody on the care team has signed off this report yet. The person can already see it."}
        </p>
      </div>
    </section>
  )
}

/** A report's review as a short label, for lists. */
export function reviewLabel(report: ReportSummary) {
  return report.reviewedAt ? "Reviewed" : "Waiting for review"
}
