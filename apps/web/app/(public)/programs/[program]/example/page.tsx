import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { BiomarkerReportView } from "@/components/biomarker-report/BiomarkerReportView"
import { ProgramReport } from "@/components/programs/ProgramReport"
import { exampleReportFor } from "@/lib/biomarker-report/example"
import { requireCurrentProgram } from "@/lib/programs/current"
import { reportItems } from "@/lib/programs/data"
import { sampleView } from "@/lib/programs/sample"

export const metadata: Metadata = { title: "Example report" }

export default async function ExampleReportPage({ params }: { params: Promise<{ program: string }> }) {
  const { instance, program } = await requireCurrentProgram((await params).program)
  // A program with a full example report (lib/biomarker-report/example.ts) shows it as the printed
  // report looks. By the owner's decision it has no "sample" label (docs/PRODUCT-ARCHITECTURE.md).
  const biomarkerReport = exampleReportFor(program)
  if (biomarkerReport) {
    return (
      <div className="space-y-6">
        <Link href={`/programs/${program.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground print:hidden">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {program.name}
        </Link>
        <BiomarkerReportView report={biomarkerReport} brandName={instance.name} />
      </div>
    )
  }
  const { example } = sampleView(program, reportItems(program))

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <header className="space-y-3">
        <Link href={`/programs/${program.slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> {program.name}
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Example report</h1>
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
          <strong>Sample data:</strong> a made-up person, to show what your report looks like. These numbers are
          invented. They are not results.
        </p>
      </header>
      <ProgramReport report={example} />
    </div>
  )
}
