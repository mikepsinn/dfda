import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import type { ReportSummary } from "@/lib/care-team/data"
import { formatDate } from "@/lib/programs/format"
import { reviewLabel } from "./ReviewStatus"

/** Biomarker reports, newest first, each with its date and review status (for the care team, with the decision). */
export function ReportList({
  reports,
  hrefFor,
  audience = "patient",
  className,
}: {
  reports: ReportSummary[]
  hrefFor: (reportId: string) => string
  audience?: "patient" | "care-team"
  className?: string
}) {
  return (
    <ul className={cn("divide-y rounded-xl border", className)}>
      {reports.map((report) => (
        <li key={report.id}>
          <Link href={hrefFor(report.id)} className="flex items-center gap-3 p-4 hover:bg-muted/50">
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{report.title}</span>
              <span className="block text-sm text-muted-foreground">{formatDate(report.reportDate)}</span>
            </span>
            <Badge variant={report.reviewedAt ? "secondary" : "outline"} className="shrink-0">
              {reviewLabel(report, audience)}
            </Badge>
            <ChevronRight aria-hidden="true" className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  )
}
