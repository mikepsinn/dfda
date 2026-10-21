import { EXAMPLE_REPORT } from "@/lib/biomarker-report/example"

export const dynamic = "force-static"

/** The example report as a file in the biomarker report format, for clinics that add their own reports. */
export function GET() {
  return Response.json(EXAMPLE_REPORT, { headers: { "Content-Disposition": 'inline; filename="example-report.json"' } })
}
