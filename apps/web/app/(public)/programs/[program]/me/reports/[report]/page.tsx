import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { BiomarkerReportView } from "@/components/biomarker-report/BiomarkerReportView"
import { ReviewStatus } from "@/components/care-team/ReviewStatus"
import { findReport } from "@/lib/care-team/data"
import { requireCurrentProgram } from "@/lib/programs/current"
import { getServerUser } from "@/lib/server-auth"

export const metadata: Metadata = { title: "Your biomarker report" }

/** One of the signed-in person's biomarker reports in a program, with its review. */
export default async function YourReportPage({ params }: { params: Promise<{ program: string; report: string }> }) {
  const { program: programSlug, report: reportId } = await params
  const { instance, program } = await requireCurrentProgram(programSlug)
  const user = await getServerUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(`/programs/${program.slug}/me/reports/${reportId}`)}`)
  const saved = await findReport(user, reportId)
  if (!saved || saved.userId !== user.id || saved.programId !== program.id) notFound()

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        href={`/programs/${program.slug}/me`}
        className="inline-flex items-center gap-1 text-sm font-medium text-primary underline print:hidden"
      >
        <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {program.name}
      </Link>
      <BiomarkerReportView report={saved.report} brandName={instance.name} review={<ReviewStatus report={saved} audience="patient" />} />
    </div>
  )
}
