import type { BiomarkerReport, LeadText } from "@/lib/biomarker-report/schema"
import { ReportSheet, type SheetFrame } from "./ReportSheet"

function Lead({ item }: { item: LeadText }) {
  return (
    <>
      <strong className="font-semibold">{item.lead}</strong> {item.text}
    </>
  )
}

/** The page for the visit: what to discuss, when to measure next, the patient's likely questions, and what the report does not do. */
export function VisitPage({
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
  const visit = report.visit!
  const hasSide = Boolean(visit.nextWindow || visit.questions.length > 0)

  return (
    <ReportSheet frame={frame} number={number} section="For the visit" personLine={personLine} labelledBy="visit-heading">
      <h2 id="visit-heading" className="report-serif text-[1.75rem] leading-tight">
        What to discuss, what to measure next, what this report does not do.
      </h2>

      <div className={`grid items-start gap-3 ${hasSide ? "lg:grid-cols-2 print:grid-cols-2" : ""}`}>
        {visit.discussion.length > 0 && (
          <div className="report-card p-4">
            <h3 className="report-label text-[color:var(--report-teal)]">Suggested discussion points</h3>
            <ul className="mt-2 list-disc space-y-2 pl-4 text-[13.5px] leading-snug">
              {visit.discussion.map((item) => (
                <li key={item.lead}>
                  <Lead item={item} />
                </li>
              ))}
            </ul>
          </div>
        )}
        {hasSide && (
          <div className="space-y-3">
            {visit.nextWindow && (
              <div className="report-card p-4">
                <h3 className="report-label text-[color:var(--report-teal)]">Next measurement window</h3>
                <p className="mt-2 text-[14.5px] leading-snug">
                  <strong className="font-semibold">{visit.nextWindow.lead}</strong> {visit.nextWindow.text}
                </p>
                {visit.nextWindow.detail && <p className="report-muted mt-1 text-[12px] leading-relaxed">{visit.nextWindow.detail}</p>}
              </div>
            )}
            {visit.questions.length > 0 && (
              <div className="report-card p-4">
                <h3 className="report-label text-[color:var(--report-teal)]">Questions the patient may ask</h3>
                <ul className="mt-2 list-disc space-y-1.5 pl-4 text-[12.5px] leading-snug">
                  {visit.questions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {visit.limits.length > 0 && (
        <div className="rounded-[14px] border border-[color:var(--report-rule)] bg-[color:var(--report-stone-soft)] p-4">
          <h3 className="report-label text-[color:var(--report-stone)]">What this report does not do</h3>
          <div className="mt-2 grid gap-3 text-[12.5px] leading-snug md:grid-cols-3">
            {visit.limits.map((item) => (
              <p key={item.lead}>
                <Lead item={item} />
              </p>
            ))}
          </div>
        </div>
      )}

      {visit.companion && (
        <p className="rounded-r-lg border-l-[3px] border-[color:var(--report-teal)] bg-[color:var(--report-teal-soft)] px-4 py-3 text-[13px] leading-snug">
          <Lead item={visit.companion} />
        </p>
      )}
    </ReportSheet>
  )
}
