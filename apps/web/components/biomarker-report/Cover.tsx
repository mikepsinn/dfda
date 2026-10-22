import { formatReportDate } from "@/lib/biomarker-report/format"
import type { BiomarkerReport } from "@/lib/biomarker-report/schema"
import { ReportSheet, type SheetFrame } from "./ReportSheet"

function Facts({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <dl className="report-card space-y-2 p-4 text-[12.5px]">
      {rows.map(([term, value]) => (
        <div key={term} className="grid grid-cols-[7.5rem_1fr] gap-3">
          <dt className="report-muted">{term}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * The first page: the brand, what the report is, its title and lead, who and
 * what was measured, and its disclaimer. In print it is a cover, with the
 * brand on top and wide spaces; on screen it heads the page, under the site's
 * own header.
 */
export function Cover({ report, frame, review }: { report: BiomarkerReport; frame: SheetFrame; review?: React.ReactNode }) {
  const { person, clinician } = report
  const personRest = [person.code, [person.age, person.sex].filter((part) => part !== undefined).join(" ")].filter(Boolean)
  // The disclaimer's first sentence is its lead, in bold.
  const [lead, ...rest] = (report.disclaimer ?? "").split(/(?<=\.)\s/)

  return (
    <ReportSheet frame={frame} number={1} label="Cover" footer={false}>
      {frame.brandName && <p className="report-print-only report-serif pt-2 text-[22px] md:pt-8 md:text-[25px]">{frame.brandName}</p>}
      <div className="space-y-5 print:pt-32">
        <p className="report-label text-[color:var(--report-teal)]">{report.edition ?? "Biomarker report"}</p>
        <h1 className="report-serif max-w-[38rem] text-[2.4rem] leading-[1.08] md:text-[3.4rem]">{report.title}</h1>
        {report.subtitle && <p className="report-muted max-w-[34rem] text-[15.5px] leading-snug">{report.subtitle}</p>}
      </div>
      <div className="grid gap-3 pt-8 md:grid-cols-2 print:pt-16">
        <Facts
          rows={[
            [
              "Participant",
              <>
                <strong className="font-semibold">{person.name}</strong>
                {personRest.length > 0 && ` · ${personRest.join(" · ")}`}
              </>,
            ],
            ["Program", report.program.name],
            ...(report.program.indication ? ([["Indication", report.program.indication]] as [string, React.ReactNode][]) : []),
            ...(clinician
              ? ([
                  [
                    "Ordering clinician",
                    <>
                      {clinician.name}
                      {(clinician.organization || clinician.location) && (
                        <span className="report-muted block">{[clinician.organization, clinician.location].filter(Boolean).join(", ")}</span>
                      )}
                    </>,
                  ],
                ] as [string, React.ReactNode][])
              : []),
          ]}
        />
        <Facts
          rows={[
            ["Timepoints", report.timepoints.map((timepoint) => timepoint.label).join(" · ")],
            ...(report.collection ? ([["Collection", report.collection]] as [string, React.ReactNode][]) : []),
            ...(report.platform ? ([["Platform", report.platform]] as [string, React.ReactNode][]) : []),
            ["Report date", formatReportDate(report.reportDate)],
          ]}
        />
      </div>
      {review && <div className="pt-6">{review}</div>}
      {report.disclaimer && (
        <p className="report-muted mt-auto max-w-[44rem] pt-8 text-[10.5px] leading-snug print:pt-16">
          <strong className="font-semibold text-[color:var(--report-ink)]">{lead}</strong> {rest.join(" ")}
        </p>
      )}
    </ReportSheet>
  )
}
