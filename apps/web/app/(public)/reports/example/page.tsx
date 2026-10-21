import type { Metadata } from "next"
import { BiomarkerReportView } from "@/components/biomarker-report/BiomarkerReportView"
import { EXAMPLE_REPORT } from "@/lib/biomarker-report/example"

export const metadata: Metadata = { title: "Example biomarker report" }

export default function ExampleBiomarkerReportPage() {
  return <BiomarkerReportView report={EXAMPLE_REPORT} />
}
