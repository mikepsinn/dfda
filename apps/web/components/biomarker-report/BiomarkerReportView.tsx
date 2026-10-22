import { summarizeReport } from "@/lib/biomarker-report/rules"
import type { BiomarkerReport } from "@/lib/biomarker-report/schema"
import { AtAGlance } from "./AtAGlance"
import { ClinicalPage } from "./ClinicalPage"
import { Cover } from "./Cover"
import { MethodsPage } from "./MethodsPage"
import { PanelPage } from "./PanelPage"
import { PrintButton } from "./PrintButton"
import { ReportSheet, type SheetFrame } from "./ReportSheet"
import { VisitPage } from "./VisitPage"

/**
 * A biomarker report (lib/biomarker-report), in the sections of its printed
 * pages: a cover, the panels at a glance, the clinic's values, one page per
 * panel, the page for the visit, and the methods. Pages without data are left
 * out. Every status and count comes from rules.ts. On screen it is a page of
 * the site, in the site's light or dark colors. Printing gives one A4 page per
 * sheet on the report's own paper, without the site header and footer, with
 * `brandName` (the site's name) on every page (app/globals.css). `review` (a
 * saved report's sign-off, lib/care-team) shows on the cover and prints with it.
 */
export function BiomarkerReportView({
  report,
  review,
  brandName,
}: {
  report: BiomarkerReport
  review?: React.ReactNode
  brandName?: string
}) {
  const summary = summarizeReport(report)
  const { person, program } = report
  const shortLine = [person.name, person.code].filter(Boolean).join(" · ")
  const longLine = [shortLine, program.name].join(" · ")

  // Page numbers: cover, at a glance, then each optional page in order.
  const hasClinical = summary.clinicalValues.length > 0
  const hasMethods = report.methods.length > 0 || Boolean(report.movers)
  const clinicalNumber = 3
  const firstPanelNumber = hasClinical ? 4 : 3
  const visitNumber = firstPanelNumber + summary.panels.length
  const methodsNumber = visitNumber + (report.visit ? 1 : 0)
  const notesNumber = methodsNumber + (hasMethods ? 1 : 0)
  const total = notesNumber - 1 + (report.sections.length > 0 ? 1 : 0)
  const frame: SheetFrame = { brandName, reportName: report.edition ?? "Biomarker report", footerNote: report.footerNote, total }

  return (
    <article className="biomarker-report mx-auto max-w-[52rem] space-y-8">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>

      <Cover report={report} frame={frame} review={review} />
      <AtAGlance report={report} summary={summary} frame={frame} personLine={longLine} />
      {hasClinical && <ClinicalPage report={report} summary={summary} frame={frame} number={clinicalNumber} personLine={shortLine} />}
      {summary.panels.map((panel, index) => (
        <PanelPage key={panel.id} report={report} panel={panel} frame={frame} number={firstPanelNumber + index} personLine={longLine} />
      ))}
      {report.visit && <VisitPage report={report} frame={frame} number={visitNumber} personLine={shortLine} />}
      {hasMethods && <MethodsPage report={report} frame={frame} number={methodsNumber} personLine={shortLine} />}
      {report.sections.length > 0 && (
        <ReportSheet frame={frame} number={notesNumber} section="Notes" personLine={shortLine} label="Notes">
          <div className="grid gap-6 md:grid-cols-2">
            {report.sections.map((section) => (
              <section key={section.title} className="space-y-2 break-inside-avoid">
                <h2 className="report-serif text-[1.35rem] leading-tight">{section.title}</h2>
                <ul className="list-disc space-y-1.5 pl-5">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </ReportSheet>
      )}
    </article>
  )
}
