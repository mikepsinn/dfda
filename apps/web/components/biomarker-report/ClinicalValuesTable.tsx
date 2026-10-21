import { formatPercent } from "@/lib/programs/format"
import { decimalsFor, formatMeasuredOrMissing } from "@/lib/biomarker-report/format"
import type { ReportSummary } from "@/lib/biomarker-report/rules"
import type { BiomarkerReport } from "@/lib/biomarker-report/schema"
import { Sparkline } from "./Sparkline"
import { StatusBadge } from "./StatusBadge"

/**
 * The clinic's laboratory values and measurements, first and last timepoint,
 * with their notes. A table from the md breakpoint and in print; a list on
 * narrow screens.
 */
export function ClinicalValuesTable({ report, values }: { report: BiomarkerReport; values: ReportSummary["clinicalValues"] }) {
  const first = report.timepoints[0]
  const last = report.timepoints[report.timepoints.length - 1]
  const weeks = report.timepoints.map((timepoint) => timepoint.week)
  const labels = report.timepoints.map((timepoint) => timepoint.label)
  const notes = values.filter((value) => value.note)
  const rows = values.map((value) => {
    const decimals = decimalsFor(value.values)
    return {
      ...value,
      firstText: formatMeasuredOrMissing(value.first, value.lowerLimit, decimals),
      lastText: formatMeasuredOrMissing(value.last, value.lowerLimit, decimals),
      changeText: value.percentChange === null ? "–" : formatPercent(value.percentChange),
      // A trend needs more than the first and last value.
      trend: value.values.filter((point) => point !== null).length > 2,
    }
  })

  return (
    <section aria-labelledby="clinical-heading" className="space-y-4">
      <div className="space-y-1">
        <h2 id="clinical-heading" className="text-xl font-semibold">
          Clinical values
        </h2>
        <p className="text-sm text-muted-foreground">
          Values from the clinic and its accredited laboratory. Clinical decisions rest on these values; the marker panels
          below are read next to them.
        </p>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border md:block print:block print:overflow-visible">
        <table className="w-full min-w-[44rem] text-left text-sm print:min-w-0 print:text-xs">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">Measure</th>
              <th scope="col" className="px-4 py-2 font-medium">Unit</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">{first.label}</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">{last.label}</th>
              <th scope="col" className="px-4 py-2 text-right font-medium">Change</th>
              <th scope="col" className="px-4 py-2 font-medium">Trend</th>
              <th scope="col" className="px-4 py-2 font-medium">Reference</th>
              <th scope="col" className="px-4 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((value) => (
              <tr key={value.name} className="break-inside-avoid">
                <th scope="row" className="px-4 py-2.5 font-medium">{value.name}</th>
                <td className="px-4 py-2.5 text-muted-foreground">{value.unit}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{value.firstText}</td>
                <td className="px-4 py-2.5 text-right font-medium tabular-nums">{value.lastText}</td>
                <td className="px-4 py-2.5 text-right tabular-nums">{value.changeText}</td>
                <td className="px-4 py-1">{value.trend && <Sparkline values={value.values} weeks={weeks} labels={labels} />}</td>
                <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{value.reference ?? "–"}</td>
                <td className="px-4 py-2.5">
                  <StatusBadge status={value.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y rounded-xl border bg-card px-4 md:hidden print:hidden" aria-label="Clinical values">
        {rows.map((value) => (
          <li key={value.name} className="space-y-1 py-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">{value.name}</p>
              <StatusBadge status={value.status} />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="tabular-nums">
                {value.firstText} → <span className="font-medium">{value.lastText}</span>{" "}
                <span className="text-muted-foreground">{value.unit}</span>
                {value.percentChange !== null && <> · {value.changeText}</>}
                {value.reference && <span className="text-muted-foreground"> · reference {value.reference}</span>}
              </p>
              {value.trend && <Sparkline values={value.values} weeks={weeks} labels={labels} />}
            </div>
          </li>
        ))}
      </ul>

      {notes.length > 0 && (
        <ul className="space-y-1 text-sm text-muted-foreground">
          {notes.map((value) => (
            <li key={value.name}>
              <span className="font-medium text-foreground">{value.name}:</span> {value.note}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
