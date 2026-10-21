import { formatReportDate } from "@/lib/biomarker-report/format"
import { summarizeReport } from "@/lib/biomarker-report/rules"
import type { BiomarkerReport } from "@/lib/biomarker-report/schema"
import { AtAGlance } from "./AtAGlance"
import { ClinicalValuesTable } from "./ClinicalValuesTable"
import { PanelSection } from "./PanelSection"
import { PrintButton } from "./PrintButton"

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{term}</dt>
      <dd className="mt-0.5">{children}</dd>
    </div>
  )
}

/**
 * A biomarker report (lib/biomarker-report): who and what was measured, the
 * panels at a glance, the clinic's values, each panel, then the report's text
 * sections. Every status and count comes from rules.ts. Printing gives A4
 * pages without the site header and footer (app/globals.css). `review` (a
 * saved report's sign-off, lib/care-team) shows under the header and prints
 * with the report.
 */
export function BiomarkerReportView({ report, review }: { report: BiomarkerReport; review?: React.ReactNode }) {
  const summary = summarizeReport(report)
  const { person, clinician } = report
  const personLine = [person.name, person.code, [person.age, person.sex].filter((part) => part !== undefined).join(" ")]
    .filter(Boolean)
    .join(" · ")

  return (
    <article className="biomarker-report mx-auto max-w-5xl space-y-10">
      <header className="brand-glow space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-medium uppercase tracking-wide text-primary">Biomarker report</p>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{report.title}</h1>
            {report.subtitle && <p className="text-lg text-muted-foreground">{report.subtitle}</p>}
          </div>
          <PrintButton />
        </div>
        <dl className="surface-raised grid gap-4 rounded-xl border bg-card p-4 text-sm sm:grid-cols-2 md:p-6 lg:grid-cols-3">
          <Fact term="Patient">{personLine}</Fact>
          <Fact term="Program">
            {report.program.name}
            {report.program.indication && <span className="block text-muted-foreground">{report.program.indication}</span>}
          </Fact>
          {clinician && (
            <Fact term="Clinician">
              {clinician.name}
              {(clinician.organization || clinician.location) && (
                <span className="block text-muted-foreground">
                  {[clinician.organization, clinician.location].filter(Boolean).join(", ")}
                </span>
              )}
            </Fact>
          )}
          <Fact term="Timepoints">{report.timepoints.map((timepoint) => timepoint.label).join(" · ")}</Fact>
          {report.collection && <Fact term="Collection">{report.collection}</Fact>}
          {report.platform && <Fact term="Platform">{report.platform}</Fact>}
          <Fact term="Report date">{formatReportDate(report.reportDate)}</Fact>
        </dl>
        {review}
      </header>

      <AtAGlance summary={summary} threshold={report.threshold} />

      {summary.clinicalValues.length > 0 && <ClinicalValuesTable report={report} values={summary.clinicalValues} />}

      <div className="space-y-6">
        {summary.panels.map((panel) => (
          <PanelSection key={panel.id} report={report} panel={panel} />
        ))}
        <p className="text-sm text-muted-foreground">
          The trend shows every timepoint from {report.timepoints[0].label} to{" "}
          {report.timepoints[report.timepoints.length - 1].label}. &ldquo;Vs noise&rdquo; is the change divided by this
          person&rsquo;s expected variation for that marker; a change under {report.threshold}× the noise is reported as
          unchanged.
        </p>
      </div>

      {report.sections.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {report.sections.map((section) => (
            <section key={section.title} className="space-y-2 break-inside-avoid">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <ul className="list-disc space-y-1.5 pl-5 text-sm">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </article>
  )
}
