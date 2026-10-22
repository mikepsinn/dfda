import { formatPercent } from "@/lib/programs/format"
import { decimalsFor, formatMeasuredOrMissing, formatReported, shortTimepoint } from "@/lib/biomarker-report/format"
import type { ReportSummary } from "@/lib/biomarker-report/rules"
import type { BiomarkerReport } from "@/lib/biomarker-report/schema"
import { ReportSheet, type SheetFrame } from "./ReportSheet"
import { StatusBadge, TONE_CLASSES } from "./StatusBadge"

const SEVERITY_TONES = { mild: "stone", notable: "amber", resolved: "teal" } as const

/** A clinical value with a value at every timepoint, as a line with its values (such as weight). */
function TrendCard({ report, value }: { report: BiomarkerReport; value: ReportSummary["clinicalValues"][number] }) {
  const width = 200
  const height = 92
  const pad = { x: 14, top: 22, bottom: 20 }
  const weeks = report.timepoints.map((timepoint) => timepoint.week)
  const points = value.values.flatMap((measured, index) =>
    measured === null ? [] : [{ value: measured, week: weeks[index], label: report.timepoints[index].label }],
  )
  const min = Math.min(...points.map((point) => point.value))
  const max = Math.max(...points.map((point) => point.value))
  const span = weeks[weeks.length - 1] - weeks[0] || 1
  const x = (week: number) => pad.x + ((week - weeks[0]) / span) * (width - 2 * pad.x)
  const y = (measured: number) => (max === min ? height / 2 : pad.top + ((max - measured) / (max - min)) * (height - pad.top - pad.bottom))
  const decimals = decimalsFor(value.values)
  const name = points.map((point) => `${point.label} ${formatReported(point.value, decimals)} ${value.unit}`).join(", ")

  return (
    <div className="report-card p-4">
      <p className="report-label text-[color:var(--report-teal)]">{value.name}</p>
      {/* Inline-block: Chrome moves a block-level SVG in the zoomed print sheet to the next page. */}
      <svg
        role="img"
        aria-label={`${value.name}: ${name}`}
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        className="mt-2 inline-block h-auto w-full align-top"
      >
        {points.map((point) => (
          <line key={`grid-${point.label}`} x1={x(point.week)} x2={x(point.week)} y1={pad.top - 6} y2={height - pad.bottom} stroke="var(--report-rule)" />
        ))}
        <polyline
          points={points.map((point) => `${x(point.week)},${y(point.value)}`).join(" ")}
          fill="none"
          stroke="var(--report-teal)"
          strokeWidth={1.75}
        />
        {points.map((point) => (
          <g key={point.label}>
            <circle cx={x(point.week)} cy={y(point.value)} r={3} fill="var(--report-card)" stroke="var(--report-teal)" strokeWidth={1.5} />
            <text x={x(point.week)} y={y(point.value) - 7} textAnchor="middle" fontSize={8} fontWeight={600} fill="var(--report-ink)">
              {formatReported(point.value, decimals)}
            </text>
            <text x={x(point.week)} y={height - 5} textAnchor="middle" fontSize={7} fill="var(--report-muted)">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

/** The program's dose from week to week, as steps on one line from the first to the last timepoint. */
function DoseCard({ report }: { report: BiomarkerReport }) {
  const dose = report.dose!
  const start = report.timepoints[0].week
  const end = report.timepoints[report.timepoints.length - 1].week
  const span = end - start || 1
  const steps = dose.steps.map((step, index) => {
    const until = dose.steps[index + 1]?.week ?? end
    return { ...step, until, share: ((until - step.week) / span) * 100 }
  })
  const marks = [...dose.steps.map((step) => step.week), end].filter((week, index, weeks) => weeks.indexOf(week) === index)

  return (
    <div className="report-card p-4">
      <p className="report-label text-[color:var(--report-teal)]">Dose schedule</p>
      <ol className="mt-3 flex gap-0.5" aria-label="Dose schedule">
        {steps.map((step, index) => (
          <li
            key={step.week}
            className="rounded-[4px] py-1 text-center text-[10.5px] font-semibold text-white"
            style={{
              width: `${step.share}%`,
              background: `color-mix(in srgb, var(--report-teal) ${40 + (60 * (index + 1)) / steps.length}%, white)`,
            }}
          >
            {formatReported(step.amount)} {dose.unit}
            <span className="sr-only">
              {" "}
              from week {step.week} to week {step.until}
            </span>
          </li>
        ))}
      </ol>
      <div className="relative mt-1 h-4 text-[10px] report-muted" aria-hidden="true">
        {marks.map((week) => (
          <span
            key={week}
            // The first label starts at its mark and the last one ends there, so both stay in the card.
            className={`absolute whitespace-nowrap ${week === start ? "" : week === end ? "-translate-x-full" : "-translate-x-1/2"}`}
            style={{ left: `${((week - start) / span) * 100}%` }}
          >
            wk {week}
          </span>
        ))}
      </div>
      {dose.note && <p className="report-muted mt-2 text-[12px] leading-snug">{dose.note}</p>}
    </div>
  )
}

/**
 * The third page: the accredited laboratory values at the first and the last
 * timepoint, next to the program's context (a value over time, the dose, the
 * reported effects), and the notes on them.
 */
export function ClinicalPage({
  report,
  summary,
  frame,
  number,
  personLine,
}: {
  report: BiomarkerReport
  summary: ReportSummary
  frame: SheetFrame
  number: number
  personLine: string
}) {
  const last = report.timepoints[report.timepoints.length - 1]
  const trend = summary.clinicalValues.find((value) => value.values.filter((measured) => measured !== null).length > 2)
  const hasContext = Boolean(trend || report.dose || report.effects.length > 0)

  return (
    <ReportSheet frame={frame} number={number} section="Clinical anchors" personLine={personLine} labelledBy="clinical-heading">
      <div className="space-y-2">
        <h2 id="clinical-heading" className="report-serif text-[1.75rem] leading-tight">
          Accredited laboratory values and program context.
        </h2>
        {report.clinicalIntro && <p className="report-muted max-w-[42rem] text-[13px] leading-snug">{report.clinicalIntro}</p>}
      </div>

      <div className={`grid items-start gap-3 ${hasContext ? "lg:grid-cols-[1fr_14rem] print:grid-cols-[1fr_14rem]" : ""}`}>
        {/* Below md the table becomes a list, so that the values and the status stay in view; print always uses the table. */}
        <div className="report-card hidden overflow-x-auto px-3 py-2 md:block print:block">
          <table className="w-full min-w-[28rem] text-left text-[11px] leading-tight">
            <thead>
              <tr className="report-rule border-b">
                <th scope="col" className="report-th px-1 py-[6px]">Measure</th>
                <th scope="col" className="report-th px-1 py-[6px]">Unit</th>
                <th scope="col" className="report-th px-1 py-[6px] text-right">Base</th>
                <th scope="col" className="report-th px-1 py-[6px] text-right">{shortTimepoint(last.label)}</th>
                <th scope="col" className="report-th px-1 py-[6px] text-right">Δ</th>
                <th scope="col" className="report-th px-1 py-[6px]">Ref.</th>
                <th scope="col" className="report-th px-1 py-[6px]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[color:var(--report-rule)]">
              {summary.clinicalValues.map((value) => {
                const decimals = decimalsFor(value.values)
                return (
                  <tr key={value.name} className="break-inside-avoid">
                    <th scope="row" className="px-1 py-[6px] font-normal">
                      {value.name}
                      {value.note && <span className="report-muted block text-[11px]">{value.note}</span>}
                    </th>
                    <td className="report-muted px-1 py-[6px]">{value.unit}</td>
                    <td className="px-1 py-[6px] text-right tabular-nums">{formatMeasuredOrMissing(value.first, value.lowerLimit, decimals)}</td>
                    <td className="px-1 py-[6px] text-right font-semibold tabular-nums">
                      {formatMeasuredOrMissing(value.last, value.lowerLimit, decimals)}
                    </td>
                    <td className="px-1 py-[6px] text-right tabular-nums">{value.percentChange === null ? "—" : formatPercent(value.percentChange)}</td>
                    <td className="report-muted px-1 py-[6px]">{value.reference}</td>
                    <td className="px-1 py-[6px]">
                      <StatusBadge status={value.status} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <ul className="report-card divide-y divide-[color:var(--report-rule)] px-4 md:hidden print:hidden" aria-label="Laboratory values">
          {summary.clinicalValues.map((value) => {
            const decimals = decimalsFor(value.values)
            return (
              <li key={value.name} className="space-y-1 py-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold leading-snug">{value.name}</p>
                  <StatusBadge status={value.status} />
                </div>
                <p className="text-[12.5px] tabular-nums">
                  {formatMeasuredOrMissing(value.first, value.lowerLimit, decimals)} →{" "}
                  <span className="font-semibold">{formatMeasuredOrMissing(value.last, value.lowerLimit, decimals)}</span>{" "}
                  <span className="report-muted">{value.unit}</span>
                  {value.percentChange !== null && <> · {formatPercent(value.percentChange)}</>}
                  {value.reference && <span className="report-muted"> · reference {value.reference}</span>}
                </p>
              </li>
            )
          })}
        </ul>

        {hasContext && (
          <div className="space-y-3">
            {trend && <TrendCard report={report} value={trend} />}
            {report.dose && <DoseCard report={report} />}
            {report.effects.length > 0 && (
              <div className="report-card p-3.5">
                <p className="report-label text-[color:var(--report-teal)]">Reported effects</p>
                <table className="mt-1.5 w-full text-[11px] leading-snug">
                  <caption className="sr-only">Reported effects</caption>
                  <tbody className="divide-y divide-[color:var(--report-rule)]">
                    {report.effects.map((effect) => {
                      const tone = TONE_CLASSES[SEVERITY_TONES[effect.severity]]
                      return (
                        <tr key={effect.weeks}>
                          <th scope="row" className="whitespace-nowrap py-1.5 pr-2 text-left align-top font-semibold">{effect.weeks}</th>
                          <td className="py-1.5 pr-1.5 align-top">{effect.text}</td>
                          <td className="whitespace-nowrap py-1.5 text-right align-top">
                            <span className={`rounded-full px-1.5 py-px text-[9.5px] font-medium ${tone.soft} ${tone.text}`}>{effect.severity}</span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {report.clinicalNotes.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {report.clinicalNotes.map((note) => {
            const tone = TONE_CLASSES[note.tone === "review" ? "amber" : "stone"]
            return (
              <p key={note.lead} className={`rounded-r-lg border-l-[3px] px-4 py-3 text-[13px] leading-snug ${tone.border} ${tone.soft}`}>
                <strong className="font-semibold">{note.lead}</strong> {note.text}
              </p>
            )
          })}
        </div>
      )}
    </ReportSheet>
  )
}
