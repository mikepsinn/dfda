import Link from "next/link"
import { StatusBadge, toneOf } from "@/components/biomarker-report/StatusBadge"
import { TONE_CLASSES, TonePill } from "@/components/status-tone"
import { decimalsFor, formatMeasuredOrMissing, formatMultiple, formatReported, VERDICT_LABELS } from "@/lib/biomarker-report/format"
import type { PanelVerdict } from "@/lib/biomarker-report/rules"
import type { BiomarkerReport } from "@/lib/biomarker-report/schema"
import type { CaseMarker } from "@/lib/care-team/case"
import type { Evidence } from "@/lib/care-team/evidence"
import { EvidenceSheet } from "./EvidenceSheet"
import { CaseCard, Eyebrow, formatPercent, SERIF } from "./parts"

const VERDICT_TONE = { intended: "teal", unchanged: "stone", review: "amber" } as const

/** A small dotted arc from the first value to the last: the shape of the film's protein cards. */
function MiniArc({ tone }: { tone: keyof typeof TONE_CLASSES }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 34" className="h-8 w-full">
      <path d="M 8 28 Q 60 -6 112 28" fill="none" stroke="var(--tone-stone)" strokeDasharray="1.5 4" strokeLinecap="round" />
      <circle cx={8} cy={28} r={3.5} fill="var(--tone-stone)" />
      <circle cx={112} cy={28} r={4.5} fill={TONE_CLASSES[tone].stroke} />
    </svg>
  )
}

/**
 * One marker's change as a card: first value → last value, the change in
 * percent and the status. With `href`, a link that selects it; without, a
 * picture of the card (the company home page).
 */
export function MarkerCard({ marker, href, selected = false }: { marker: CaseMarker; href?: string; selected?: boolean }) {
  const tone = toneOf(marker.status)
  const decimals = decimalsFor(marker.values)
  const body = (
    <>
      <Eyebrow className={`truncate ${TONE_CLASSES[tone].text}`}>{marker.panelName}</Eyebrow>
      <p className={`${SERIF} text-3xl`}>{marker.id}</p>
      <p className="truncate text-xs text-muted-foreground">{marker.name}</p>
      <MiniArc tone={tone} />
      <p className="flex items-baseline gap-1.5">
        <span className="text-muted-foreground">{formatMeasuredOrMissing(marker.first, marker.lowerLimit, decimals)}</span>
        <span aria-hidden="true" className="text-muted-foreground">
          →
        </span>
        <span className="sr-only">to</span>
        <span className={`${SERIF} text-3xl`}>{formatMeasuredOrMissing(marker.last, marker.lowerLimit, decimals)}</span>
        <span className="text-xs text-muted-foreground">{marker.unit}</span>
      </p>
      <p className="flex flex-wrap gap-1.5">
        {marker.percentChange !== null && (
          <TonePill tone={tone} className="px-1.5 py-px text-[10px]">
            {formatPercent(marker.percentChange)}
          </TonePill>
        )}
        <StatusBadge status={marker.status} />
      </p>
    </>
  )
  const card = "surface-raised block space-y-1 rounded-3xl border bg-card p-4"
  if (!href) return <div className={card}>{body}</div>
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={selected ? "true" : undefined}
      className={`${card} transition-colors hover:border-primary ${selected ? "border-primary ring-1 ring-primary" : ""}`}
    >
      {body}
    </Link>
  )
}

/** The report's panels as tiles, "grouped by pathway, not a single score": each marker a chip in its status color. */
export function PathwayGrid({
  panels,
  hrefFor,
  selectedKey,
}: {
  panels: { id: string; name: string; verdict: PanelVerdict; markers: CaseMarker[] }[]
  hrefFor: (marker: CaseMarker) => string
  selectedKey: string | null
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {panels.map((panel) => (
        <li key={panel.id} className="surface-raised space-y-3 rounded-3xl border bg-card p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold leading-tight">{panel.name}</h3>
            <TonePill tone={VERDICT_TONE[panel.verdict]} className="px-1.5 py-px text-[10px]">
              {VERDICT_LABELS[panel.verdict]}
            </TonePill>
          </div>
          <ul className="flex flex-wrap gap-1.5" aria-label={`Markers of ${panel.name}`}>
            {panel.markers.map((marker) => {
              const tone = toneOf(marker.status)
              const selected = marker.key === selectedKey
              return (
                <li key={marker.key}>
                  <Link
                    href={hrefFor(marker)}
                    scroll={false}
                    aria-current={selected ? "true" : undefined}
                    title={`${marker.name}: ${marker.status === "below-limit" ? "below the lower limit" : marker.status}`}
                    className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${TONE_CLASSES[tone].soft} ${TONE_CLASSES[tone].text} ${
                      selected ? "ring-2 ring-primary" : ""
                    } ${marker.status === "below-limit" ? "opacity-60" : ""}`}
                  >
                    {marker.id}
                  </Link>
                </li>
              )
            })}
          </ul>
        </li>
      ))}
    </ul>
  )
}

const W = 720
const H = 300
const LEFT = 56
const RIGHT = 24
const TOP = 28
const BOTTOM = 210

/**
 * One marker over the timepoints: the observed values as dots joined by
 * dotted lines (nothing between two timepoints is invented), the band of this
 * person's own noise around the first value, and the dose steps below.
 */
function MarkerChart({ marker, report }: { marker: CaseMarker; report: BiomarkerReport }) {
  const weeks = report.timepoints.map((timepoint) => timepoint.week)
  const points = marker.values.flatMap((value, index) => (value === null ? [] : [{ value, week: weeks[index], label: report.timepoints[index].label }]))
  const baseline = marker.values[0]
  const band = baseline === null ? null : { low: baseline - report.threshold * marker.noise, high: baseline + report.threshold * marker.noise }
  const all = [...points.map((point) => point.value), ...(band ? [band.low, band.high] : [])]
  if (!all.length) return <p className="text-sm text-muted-foreground">No quantified value at any timepoint.</p>
  const pad = (Math.max(...all) - Math.min(...all)) * 0.12 || Math.abs(all[0]) * 0.1 || 1
  const min = Math.min(...all) - pad
  const max = Math.max(...all) + pad
  const first = weeks[0]
  const span = weeks[weeks.length - 1] - first || 1
  const x = (week: number) => LEFT + ((week - first) / span) * (W - LEFT - RIGHT)
  const y = (value: number) => TOP + ((max - value) / (max - min)) * (BOTTOM - TOP)
  const decimals = decimalsFor(marker.values)
  const color = TONE_CLASSES[toneOf(marker.status)].stroke
  const steps = report.dose?.steps ?? []
  const maxDose = Math.max(...steps.map((step) => step.amount), 1)
  const description = `${marker.name}: ${points.map((point) => `${point.label} ${formatReported(point.value, decimals)} ${marker.unit}`).join(", ")}.`

  return (
    <svg role="img" aria-label={description} viewBox={`0 0 ${W} ${H}`} className="w-full">
      {band && (
        <g>
          <rect x={LEFT} y={y(band.high)} width={W - LEFT - RIGHT} height={y(band.low) - y(band.high)} fill="var(--tone-stone-soft)" />
          <text x={W - RIGHT - 6} y={y(band.high) + 14} textAnchor="end" fontSize={11} fill="hsl(var(--muted-foreground))">
            Within {formatMultiple(report.threshold)} this person&apos;s noise
          </text>
        </g>
      )}
      {[min + pad, (min + max) / 2, max - pad].map((tick) => (
        <text key={tick} x={LEFT - 8} y={y(tick) + 4} textAnchor="end" fontSize={11} fill="hsl(var(--muted-foreground))">
          {formatReported(tick, decimals)}
        </text>
      ))}
      {points.slice(1).map((point, index) => (
        <line
          key={point.label}
          x1={x(points[index].week)}
          y1={y(points[index].value)}
          x2={x(point.week)}
          y2={y(point.value)}
          stroke={color}
          strokeWidth={1.75}
          strokeDasharray="2 5"
          strokeLinecap="round"
        />
      ))}
      {points.map((point, index) => {
        const last = index === points.length - 1
        return (
          <g key={point.label}>
            <circle cx={x(point.week)} cy={y(point.value)} r={last ? 7 : 5} fill={last ? color : "hsl(var(--card))"} stroke={index === 0 ? "var(--tone-stone)" : color} strokeWidth={2} />
            <text x={x(point.week)} y={y(point.value) - 12} textAnchor="middle" fontSize={12} fontWeight={600} fill="hsl(var(--foreground))">
              {formatReported(point.value, decimals)}
            </text>
          </g>
        )
      })}
      {report.timepoints.map((timepoint) => (
        <text key={timepoint.label} x={x(timepoint.week)} y={BOTTOM + 20} textAnchor="middle" fontSize={11} fill="hsl(var(--muted-foreground))">
          {timepoint.label}
        </text>
      ))}
      {steps.length > 0 && (
        <g>
          <text x={LEFT - 8} y={BOTTOM + 62} textAnchor="end" fontSize={11} fill="hsl(var(--muted-foreground))">
            Dose
          </text>
          {steps.map((step, index) => {
            const from = x(Math.max(first, step.week))
            const to = x(steps[index + 1]?.week ?? weeks[weeks.length - 1])
            const height = 10 + 18 * (step.amount / maxDose)
            return (
              <g key={step.week}>
                <rect x={from} y={BOTTOM + 70 - height} width={Math.max(0, to - from - 2)} height={height} rx={3} fill="var(--tone-teal-soft)" stroke="var(--tone-teal)" strokeWidth={1} />
                <text x={from + 6} y={BOTTOM + 66} fontSize={10} fontWeight={600} fill="var(--tone-teal)">
                  {formatReported(step.amount)} {report.dose?.unit}
                </text>
              </g>
            )
          })}
        </g>
      )}
    </svg>
  )
}

/** The selected marker: its change, its chart, what the program intends, and what studies report, with their sources. */
export function MarkerDetail({
  marker,
  report,
  evidence,
  siblings,
  hrefFor,
}: {
  marker: CaseMarker
  report: BiomarkerReport
  evidence: Evidence | null
  /** The other markers of its panel, to move to. */
  siblings: CaseMarker[]
  hrefFor: (marker: CaseMarker) => string
}) {
  const counted = marker.values.filter((value) => value !== null).length
  return (
    <CaseCard id="marker" aria-labelledby="marker-heading" className="scroll-mt-36 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <Eyebrow>{marker.panelName}</Eyebrow>
          <h3 id="marker-heading" className="text-xl font-semibold">
            {marker.id} <span className="font-normal text-muted-foreground">· {marker.name} · {marker.unit}</span>
          </h3>
          <p className="text-sm text-muted-foreground">
            The program intends it to go {marker.intended}.
            {marker.noiseMultiple !== null && ` It changed ${formatMultiple(marker.noiseMultiple)} this person's noise`}
            {marker.percentChange !== null && ` (${formatPercent(marker.percentChange)})`}
            {marker.noiseMultiple !== null && "."}
          </p>
        </div>
        <StatusBadge status={marker.status} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,720px)_1fr]">
        <div className="min-w-0 space-y-2">
          {/* At its own size on a desktop; on a phone it scrolls sideways, so that its labels stay readable. */}
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <MarkerChart marker={marker} report={report} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{counted} timepoints. Nothing between them is invented. Association, not causation.</p>
        </div>
        {siblings.length > 0 && (
          <nav aria-label={`Other markers of ${marker.panelName}`} className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Also in {marker.panelName}</p>
            <ul className="space-y-1.5">
              {siblings.map((sibling) => {
                const decimals = decimalsFor(sibling.values)
                return (
                  <li key={sibling.key}>
                    <Link
                      href={hrefFor(sibling)}
                      scroll={false}
                      className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-sm hover:border-primary"
                    >
                      <span className="min-w-0">
                        <span className="font-semibold">{sibling.id}</span>{" "}
                        <span className="text-xs text-muted-foreground">
                          {formatMeasuredOrMissing(sibling.first, sibling.lowerLimit, decimals)} → {formatMeasuredOrMissing(sibling.last, sibling.lowerLimit, decimals)}
                        </span>
                      </span>
                      <StatusBadge status={sibling.status} />
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        {evidence ? (
          <>
            <p className="text-sm">
              <span className="font-medium">Studies: </span>
              {evidence.summary}
            </p>
            <EvidenceSheet markerName={marker.id} evidence={evidence} />
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No verified reference yet for {marker.id} on this program&apos;s drug.</p>
        )}
      </div>
    </CaseCard>
  )
}
