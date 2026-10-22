import type { Metadata } from "next"
import { BiomarkerReportView } from "@/components/biomarker-report/BiomarkerReportView"
import { EXAMPLE_REPORT } from "@/lib/biomarker-report/example"
import { env } from "@/lib/env"
import { resolveInstance } from "@/lib/instance/resolve"

export const metadata: Metadata = { title: "Example biomarker report" }

export default async function ExampleBiomarkerReportPage() {
  const brandName = (await resolveInstance())?.name ?? env.NEXT_PUBLIC_SITE_NAME
  return <BiomarkerReportView report={EXAMPLE_REPORT} brandName={brandName} />
}
