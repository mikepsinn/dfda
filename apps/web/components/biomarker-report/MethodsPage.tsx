import { formatPercent } from "@/lib/programs/format"
import { formatMultiple } from "@/lib/biomarker-report/format"
import type { BiomarkerReport } from "@/lib/biomarker-report/schema"
import { ReportSheet, type SheetFrame } from "./ReportSheet"

/** The last page: how the report was produced, and the largest movers outside the report's panels. */
export function MethodsPage({
  report,
  frame,
  number,
  personLine,
}: {
  report: BiomarkerReport
  frame: SheetFrame
  number: number
  personLine: string
}) {
  const { methods, movers } = report
  const last = report.timepoints[report.timepoints.length - 1]

  return (
    <ReportSheet frame={frame} number={number} section="Methods & appendix" personLine={personLine} label="Methods & appendix">
      <div className={`grid items-start gap-8 ${methods.length > 0 && movers ? "lg:grid-cols-2 print:grid-cols-2" : ""}`}>
        {methods.length > 0 && (
          <div className="space-y-3">
            <h2 className="report-serif text-[1.35rem] leading-tight">How this report was produced</h2>
            <dl className="space-y-2 text-[11.5px] leading-snug">
              {methods.map((method) => (
                <div key={method.term} className="grid grid-cols-[5.5rem_1fr] gap-3">
                  <dt className="report-muted">{method.term}</dt>
                  <dd>{method.text}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
        {movers && (
          <div className="space-y-3">
            <h2 className="report-serif text-[1.35rem] leading-tight">Largest whole-panel movers outside the curated panels</h2>
            <p className="report-muted text-[11.5px] leading-snug">{movers.intro}</p>
            <div className="report-card overflow-x-auto px-2.5 py-2">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="report-rule border-b">
                    <th scope="col" className="report-th px-1 py-2">Gene</th>
                    <th scope="col" className="report-th px-1 py-2">{report.markerNoun}</th>
                    <th scope="col" className="report-th px-1 py-2 text-right">Δ {last.label.replace(/^Week\s+/i, "Wk")}</th>
                    <th scope="col" className="report-th px-1 py-2 text-right">Vs noise</th>
                    <th scope="col" className="report-th px-1 py-2 text-right">Detect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[color:var(--report-rule)]">
                  {movers.items.map((mover) => (
                    <tr key={mover.id}>
                      <th scope="row" className="px-1 py-[5px] font-semibold">{mover.id}</th>
                      <td className="report-muted max-w-[6.5rem] truncate px-1 py-[5px]" title={mover.name}>{mover.name}</td>
                      <td className="px-1 py-[5px] text-right tabular-nums">{formatPercent(mover.percentChange)}</td>
                      <td className="px-1 py-[5px] text-right tabular-nums">{formatMultiple(mover.noiseMultiple)}</td>
                      <td className="px-1 py-[5px] text-right tabular-nums">
                        {mover.detected}/{mover.of}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      {movers?.note && <p className="report-muted text-[11px] leading-snug">{movers.note}</p>}
    </ReportSheet>
  )
}
