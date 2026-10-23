import { TonePill, type Tone } from "@/components/status-tone"
import { formatChange, formatDate, formatPercent, formatValue, STATUS_LABELS } from "@/lib/programs/format"
import type { MeasureStatus, PersonReport } from "@/lib/programs/report"

/** The tones of the biomarker reports: teal for improved, amber for review (worse), stone otherwise. */
const STATUS_TONES: Record<MeasureStatus, Tone> = {
  improved: "teal",
  unchanged: "stone",
  worse: "amber",
  changed: "stone",
  waiting: "stone",
}

/** A person's before/after report: a one-line verdict, then each measure at the start and now. */
export function ProgramReport({ report }: { report: PersonReport }) {
  return (
    <section aria-labelledby="report-heading" className="space-y-4">
      <div className="space-y-1">
        <h2 id="report-heading" className="text-xl font-semibold">
          Before and now
        </h2>
        <p className="text-lg font-medium">{report.verdict}</p>
        <p className="text-sm text-muted-foreground">
          Started {formatDate(report.startedAt)} · Follow-up {formatDate(report.followUpAt)}
        </p>
      </div>
      <div className="surface-raised overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Measure</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Before</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Now</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Change</th>
              <th scope="col" className="px-4 py-2 font-medium">Result</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {report.measures.map((measure) => (
              <tr key={measure.variableId}>
                <th scope="row" className="px-4 py-3 font-medium">
                  {measure.name} <span className="font-normal text-muted-foreground">({measure.unit})</span>
                  {measure.kind === "lab" && <span className="ml-2 text-xs font-normal text-muted-foreground">lab</span>}
                </th>
                <td className="px-4 py-3 text-right tabular-nums">{measure.before === null ? "–" : formatValue(measure.before)}</td>
                <td className="px-4 py-3 text-right tabular-nums">{measure.after === null ? "–" : formatValue(measure.after)}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {measure.change === null ? (
                    "–"
                  ) : (
                    <>
                      {formatChange(measure.change)}
                      {measure.percentChange !== null && (
                        <>
                          {" "}
                          <span className="text-muted-foreground">({formatPercent(measure.percentChange)})</span>
                        </>
                      )}
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  <TonePill tone={STATUS_TONES[measure.status]} className="px-2.5 py-0.5 text-xs">
                    {STATUS_LABELS[measure.status]}
                  </TonePill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground">
        &ldquo;Before&rdquo; uses values up to one week after the start; &ldquo;now&rdquo; uses the latest two weeks of values.
        A change after the start does not prove that the product caused it.
      </p>
    </section>
  )
}
