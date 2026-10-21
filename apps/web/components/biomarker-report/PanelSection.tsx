import { formatPercent } from "@/lib/programs/format"
import { decimalsFor, formatIndex, formatMeasuredOrMissing, formatMultiple, VERDICT_LABELS } from "@/lib/biomarker-report/format"
import type { ReportSummary } from "@/lib/biomarker-report/rules"
import type { BiomarkerReport } from "@/lib/biomarker-report/schema"
import { Sparkline } from "./Sparkline"
import { StatusBadge } from "./StatusBadge"

type PanelSummary = ReportSummary["panels"][number]

/**
 * One organ system or pathway: its verdict, index and summary, then each
 * marker at the first and last timepoint. A table from the md breakpoint and
 * in print; a list on narrow screens, so the status stays in view.
 */
export function PanelSection({ report, panel }: { report: BiomarkerReport; panel: PanelSummary }) {
  const first = report.timepoints[0]
  const last = report.timepoints[report.timepoints.length - 1]
  const weeks = report.timepoints.map((timepoint) => timepoint.week)
  const labels = report.timepoints.map((timepoint) => timepoint.label)
  const { counts } = panel
  const markers = panel.markers.map((marker) => {
    const decimals = decimalsFor(marker.values)
    return {
      ...marker,
      firstText: formatMeasuredOrMissing(marker.first, marker.lowerLimit, decimals),
      lastText: formatMeasuredOrMissing(marker.last, marker.lowerLimit, decimals),
      changeText: marker.percentChange === null ? "–" : formatPercent(marker.percentChange),
      noiseText: marker.noiseMultiple === null ? "–" : formatMultiple(marker.noiseMultiple),
    }
  })

  return (
    <section
      id={`panel-${panel.id}`}
      aria-labelledby={`panel-${panel.id}-heading`}
      className="scroll-mt-24 space-y-4 rounded-xl border bg-card p-4 md:p-6 print:break-inside-avoid"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 id={`panel-${panel.id}-heading`} className="text-xl font-semibold">
            {panel.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {panel.index === null ? "No index" : `Index ${formatIndex(panel.index)} the noise`} · {panel.markers.length}{" "}
            {panel.markers.length === 1 ? "marker" : "markers"}: {counts.intended} intended, {counts.unchanged} unchanged,{" "}
            {counts.review} to review
            {counts["below-limit"] > 0 && `, ${counts["below-limit"]} below the limit`}
          </p>
        </div>
        <p className="text-sm">
          <span className="sr-only">Verdict: </span>
          <StatusBadge status={panel.verdict} />
        </p>
      </div>
      <p className="max-w-3xl">{panel.summary}</p>

      <div className="hidden overflow-x-auto md:block print:block print:overflow-visible">
        <table className="w-full min-w-[46rem] text-left text-sm print:min-w-0 print:text-xs">
          <caption className="sr-only">
            {panel.name}: {VERDICT_LABELS[panel.verdict]}
          </caption>
          <thead className="border-b text-muted-foreground">
            <tr>
              <th scope="col" className="py-2 pr-4 font-medium">Marker</th>
              <th scope="col" className="px-2 py-2 font-medium">Unit</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">{first.label}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">{last.label}</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Change</th>
              <th scope="col" className="px-2 py-2 font-medium">Trend</th>
              <th scope="col" className="px-2 py-2 text-right font-medium">Vs noise</th>
              <th scope="col" className="py-2 pl-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {markers.map((marker) => (
              <tr key={marker.id} className="break-inside-avoid">
                <th scope="row" className="py-2.5 pr-4 font-normal">
                  <span className="font-semibold">{marker.id}</span> {marker.name}
                  {marker.note && <span className="block text-xs text-muted-foreground">{marker.note}</span>}
                </th>
                <td className="px-2 py-2.5 text-muted-foreground">{marker.unit}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">{marker.firstText}</td>
                <td className="px-2 py-2.5 text-right font-medium tabular-nums">{marker.lastText}</td>
                <td className="px-2 py-2.5 text-right tabular-nums">{marker.changeText}</td>
                <td className="px-2 py-1">
                  <Sparkline values={marker.values} weeks={weeks} labels={labels} />
                </td>
                <td className="px-2 py-2.5 text-right tabular-nums">{marker.noiseText}</td>
                <td className="py-2.5 pl-2">
                  <StatusBadge status={marker.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="divide-y border-t md:hidden print:hidden" aria-label={`${panel.name} markers`}>
        {markers.map((marker) => (
          <li key={marker.id} className="space-y-1.5 py-3">
            <div className="flex items-start justify-between gap-3">
              <p>
                <span className="font-semibold">{marker.id}</span> {marker.name}
                {marker.note && <span className="block text-xs text-muted-foreground">{marker.note}</span>}
              </p>
              <StatusBadge status={marker.status} />
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <p className="tabular-nums">
                {marker.firstText} → <span className="font-medium">{marker.lastText}</span>{" "}
                <span className="text-muted-foreground">{marker.unit}</span>
                {marker.percentChange !== null && <> · {marker.changeText}</>}
                {marker.noiseMultiple !== null && <> · {marker.noiseText} noise</>}
              </p>
              <Sparkline values={marker.values} weeks={weeks} labels={labels} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
