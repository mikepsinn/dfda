import { TONE_CLASSES } from "@/components/status-tone"
import { formatPercent } from "@/lib/programs/format"
import { decimalsFor, formatIndex, formatMeasuredOrMissing, formatMultiple, VERDICT_LABELS } from "@/lib/biomarker-report/format"
import type { ReportSummary } from "@/lib/biomarker-report/rules"
import type { BiomarkerReport } from "@/lib/biomarker-report/schema"
import { ReportSheet, type SheetFrame } from "./ReportSheet"
import { Sparkline } from "./Sparkline"
import { StatusBadge, toneOf } from "./StatusBadge"

type PanelSummary = ReportSummary["panels"][number]

/** The panel's verdict, its index on a gauge from −3 to +3 (or wider), and its counts. */
function VerdictCard({ report, panel }: { report: BiomarkerReport; panel: PanelSummary }) {
  const tone = TONE_CLASSES[toneOf(panel.verdict)]
  const { counts } = panel
  const extent = Math.max(3, Math.ceil(Math.abs(panel.index ?? 0)))
  const share = panel.index === null ? 0 : (Math.min(Math.abs(panel.index), extent) / extent) * 50
  const noun = report.markerNoun
  const parts = [`${counts.intended} moved`, `${counts.unchanged} unchanged`, `${counts.review} review`]
  if (counts["below-limit"] > 0) parts.push(`${counts["below-limit"]} below LLOQ`)

  return (
    <div className={`report-card w-full border-t-[3px] p-4 md:w-[13.5rem] md:shrink-0 ${tone.topBorder}`}>
      <p className={`report-label ${tone.text}`}>System verdict</p>
      <p className={`mt-1 text-[16px] font-semibold ${tone.text}`}>{VERDICT_LABELS[panel.verdict]}</p>
      <div className="relative mt-3 h-2 rounded-full bg-[color:var(--report-stone-soft)]" aria-hidden="true">
        <span className="absolute -inset-y-0.5 left-1/2 w-px bg-[color:var(--report-stone)]" />
        {panel.index !== null && (
          <span
            className={`absolute inset-y-0 rounded-[2px] ${tone.solid}`}
            style={panel.index >= 0 ? { left: "50%", width: `${Math.max(share, 1)}%` } : { right: "50%", width: `${Math.max(share, 1)}%` }}
          />
        )}
      </div>
      <p className="report-muted mt-3 text-[11px] leading-snug">
        Organ response index {panel.index === null ? "–" : formatIndex(panel.index)} noise band · {panel.markers.length}{" "}
        {panel.markers.length === 1 ? noun : `${noun}s`} · {parts.join(" / ")}
      </p>
    </div>
  )
}

/**
 * One organ system or pathway on its own page: its summary and verdict, then
 * each marker at the first and last timepoint with its trajectory, change in
 * multiples of the noise, and status.
 */
export function PanelPage({
  report,
  panel,
  frame,
  number,
  personLine,
}: {
  report: BiomarkerReport
  panel: PanelSummary
  frame: SheetFrame
  number: number
  personLine: string
}) {
  const first = report.timepoints[0]
  const last = report.timepoints[report.timepoints.length - 1]
  const weeks = report.timepoints.map((timepoint) => timepoint.week)
  const labels = report.timepoints.map((timepoint) => timepoint.label)
  const noun = report.markerNoun

  return (
    <ReportSheet
      frame={frame}
      number={number}
      section={panel.name}
      sectionInPrintOnly
      personLine={personLine}
      id={`panel-${panel.id}`}
      labelledBy={`panel-${panel.id}-heading`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-[30rem] space-y-2">
          <h2 id={`panel-${panel.id}-heading`} className="report-serif text-[1.75rem] leading-tight">
            {panel.name}
          </h2>
          {panel.summary && <p className="text-[13.5px] leading-snug">{panel.summary}</p>}
        </div>
        <VerdictCard report={report} panel={panel} />
      </div>

      {/* Below md the table becomes a list, so that the values and the status stay in view; print always uses the table. */}
      <div className="report-card hidden overflow-x-auto px-3 py-2 md:block print:block">
        <table className="w-full min-w-[38rem] text-left text-[11.5px] leading-tight">
          <caption className="sr-only">
            {panel.name}: {VERDICT_LABELS[panel.verdict]}
          </caption>
          <thead>
            <tr className="report-rule border-b">
              <th scope="col" className="report-th px-1 py-2">{noun}</th>
              <th scope="col" className="report-th px-1 py-2">Unit</th>
              <th scope="col" className="report-th px-1 py-2 text-right">{first.label}</th>
              <th scope="col" className="report-th px-1 py-2 text-right">{last.label}</th>
              <th scope="col" className="report-th px-1 py-2 text-right">Δ</th>
              <th scope="col" className="report-th px-1 py-2">Trajectory</th>
              <th scope="col" className="report-th px-1 py-2 text-right">Vs noise</th>
              <th scope="col" className="report-th px-1 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--report-rule)]">
            {panel.markers.map((marker) => {
              const decimals = decimalsFor(marker.values)
              return (
                <tr key={marker.id} className="break-inside-avoid">
                  <th scope="row" className="px-1 py-[7px] font-normal leading-snug">
                    <span className="block max-w-[14rem] truncate" title={`${marker.id} ${marker.name}`}>
                      <span className="font-semibold">{marker.id}</span> <span className="text-[10.5px]">{marker.name}</span>
                    </span>
                    {marker.note && (
                      <span className="report-muted block max-w-[14rem] truncate text-[10.5px]" title={marker.note}>
                        {marker.note}
                      </span>
                    )}
                  </th>
                  <td className="report-muted px-1 py-[7px]">{marker.unit}</td>
                  <td className="px-1 py-[7px] text-right tabular-nums">{formatMeasuredOrMissing(marker.first, marker.lowerLimit, decimals)}</td>
                  <td className="px-1 py-[7px] text-right font-semibold tabular-nums">
                    {formatMeasuredOrMissing(marker.last, marker.lowerLimit, decimals)}
                  </td>
                  <td className="px-1 py-[7px] text-right tabular-nums">{marker.percentChange === null ? "—" : formatPercent(marker.percentChange)}</td>
                  <td className="px-1 py-1">
                    {marker.status === "below-limit" ? (
                      <span className="report-muted text-[10px]">below LLOQ</span>
                    ) : (
                      <Sparkline values={marker.values} weeks={weeks} labels={labels} tone={toneOf(marker.status)} />
                    )}
                  </td>
                  <td className="report-muted px-1 py-[7px] text-right tabular-nums">
                    {marker.noiseMultiple === null ? "—" : formatMultiple(marker.noiseMultiple)}
                  </td>
                  <td className="px-1 py-[7px]">
                    <StatusBadge status={marker.status} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <ul className="report-card divide-y divide-[color:var(--report-rule)] px-4 md:hidden print:hidden" aria-label={`${panel.name} ${noun}s`}>
        {panel.markers.map((marker) => {
          const decimals = decimalsFor(marker.values)
          return (
            <li key={marker.id} className="space-y-1.5 py-3">
              <div className="flex items-start justify-between gap-3">
                <p className="leading-snug">
                  <span className="font-semibold">{marker.id}</span> {marker.name}
                  {marker.note && <span className="report-muted block text-[12px]">{marker.note}</span>}
                </p>
                <StatusBadge status={marker.status} />
              </div>
              <div className="flex items-center justify-between gap-3 text-[12.5px]">
                <p className="tabular-nums">
                  {formatMeasuredOrMissing(marker.first, marker.lowerLimit, decimals)} →{" "}
                  <span className="font-semibold">{formatMeasuredOrMissing(marker.last, marker.lowerLimit, decimals)}</span>{" "}
                  <span className="report-muted">{marker.unit}</span>
                  {marker.percentChange !== null && <> · {formatPercent(marker.percentChange)}</>}
                  {marker.noiseMultiple !== null && <> · {formatMultiple(marker.noiseMultiple)} noise</>}
                </p>
                {marker.status !== "below-limit" && <Sparkline values={marker.values} weeks={weeks} labels={labels} tone={toneOf(marker.status)} />}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="report-muted text-[10.5px] leading-snug">
        Trajectory shows {labels.join(" → ")}. &ldquo;Vs noise&rdquo; is the {last.label} change divided by this
        patient&rsquo;s expected within-person variation for that {noun}. Changes under {formatMultiple(report.threshold)} are
        reported as unchanged.{report.panelNote && ` ${report.panelNote}`}
      </p>
    </ReportSheet>
  )
}
