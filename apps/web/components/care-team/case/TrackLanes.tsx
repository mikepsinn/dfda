import { decimalsFor, formatReported } from "@/lib/biomarker-report/format"
import type { CaseTimeline, TimelineLane } from "@/lib/care-team/case"
import { weekLabel } from "./parts"

const SEVERITY_CLASSES = {
  notable: "bg-[color:var(--tone-amber-soft)] text-[color:var(--tone-amber)]",
  mild: "bg-[color:var(--tone-stone-soft)] text-foreground",
  resolved: "bg-[color:var(--tone-teal-soft)] text-[color:var(--tone-teal)]",
} as const

/** A lane's values in words, for screen readers. */
function describe(lane: TimelineLane): string {
  if (lane.kind === "steps") return lane.steps.map((step) => `${formatReported(step.amount)} ${lane.unit} from ${weekLabel(step.from)}`).join(", ")
  if (lane.kind === "spans") return lane.spans.map((span) => `${weekLabel(span.from)} to ${weekLabel(span.to)}: ${span.text}`).join("; ")
  const values = lane.points.map((point) => point.value)
  const decimals = decimalsFor(values)
  return `${values.length} values from ${formatReported(Math.min(...values), decimals)} to ${formatReported(Math.max(...values), decimals)} ${lane.unit}`
}

/**
 * What the person logged, on one time axis with the samples: the dose as
 * steps, check-ins and lab values as dots (never joined into a curve), and
 * reported effects as spans. Each lane's values are also in its accessible name.
 */
export function TrackLanes({ timeline, compact = false, fit = false }: { timeline: CaseTimeline; compact?: boolean; fit?: boolean }) {
  const { start, end, samples, lanes } = timeline
  const span = Math.max(1, end - start)
  // Inside a margin, so that the first and last values keep room for their labels.
  const at = (week: number) => `calc(1rem + (100% - 2rem) * ${(Math.min(end, Math.max(start, week)) - start) / span})`
  const every = span > 26 ? 4 : span > 12 ? 2 : 1
  const firstTick = Math.ceil(start / every) * every
  const ticks = Array.from({ length: Math.floor((end - firstTick) / every) + 1 }, (_, index) => firstTick + index * every)
  const height = compact ? "h-7" : "h-10"
  // `fit`: the whole program in the width of the box, also on a phone, with every second week label there; otherwise it scrolls.
  const columns = fit ? "grid-cols-[5.5rem_1fr] gap-2 sm:grid-cols-[9.5rem_1fr] sm:gap-3" : "grid-cols-[9.5rem_1fr] gap-3"

  const sampleLines = samples.map((sample) => (
    <span key={sample.label} aria-hidden="true" className="absolute inset-y-0 w-px bg-[color:var(--tone-teal)] opacity-40" style={{ left: at(sample.week) }} />
  ))

  return (
    <div className={fit ? "" : "overflow-x-auto"}>
      <div className={`space-y-1 ${fit ? "" : "min-w-[640px]"}`}>
        <div className={`grid ${columns}`}>
          <span />
          <div aria-hidden="true" className="relative h-7 text-[11px] text-muted-foreground">
            {ticks.map((week, index) => (
              <span
                key={week}
                className={`absolute top-0 -translate-x-1/2 whitespace-nowrap ${fit && index % 2 ? "max-sm:hidden" : ""}`}
                style={{ left: at(week) }}
              >
                {weekLabel(week)}
              </span>
            ))}
            {/* Each sample as a dot under its week, above the sample's line through the lanes. */}
            {samples.map((sample) => (
              <span
                key={sample.label}
                className="absolute bottom-0.5 h-2 w-2 -translate-x-1/2 rounded-full bg-[color:var(--tone-teal)]"
                style={{ left: at(sample.week) }}
              />
            ))}
          </div>
        </div>

        {lanes.map((lane) => (
          <div key={`${lane.kind}:${lane.name}`} className={`grid items-center border-t py-1.5 ${columns}`}>
            <p className="text-xs leading-tight">
              <span className="font-medium">{lane.name}</span>
              {lane.kind !== "spans" && <span className="text-muted-foreground"> ({lane.unit})</span>}
            </p>
            <div role="img" aria-label={`${lane.name}: ${describe(lane)}`} className={`relative ${lane.kind === "spans" ? "h-9" : height}`}>
              {sampleLines}
              {lane.kind === "steps" && <Steps lane={lane} at={at} />}
              {lane.kind === "points" && <Dots lane={lane} at={at} />}
              {lane.kind === "spans" &&
                lane.spans.map((item) => (
                  <span
                    key={`${item.from}:${item.text}`}
                    title={`${weekLabel(item.from)}–${weekLabel(item.to)}: ${item.text}`}
                    className={`absolute top-1 h-7 truncate rounded-md px-1.5 text-[11px] leading-7 ${SEVERITY_CLASSES[item.severity]}`}
                    style={{ left: at(item.from), width: `calc(${at(item.to)} - ${at(item.from)} - 2px)` }}
                  >
                    {item.text}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Steps({ lane, at }: { lane: Extract<TimelineLane, { kind: "steps" }>; at: (week: number) => string }) {
  const max = Math.max(...lane.steps.map((step) => step.amount))
  return lane.steps.map((step) => (
    <span
      key={step.from}
      title={`${formatReported(step.amount)} ${lane.unit} from ${weekLabel(step.from)}`}
      className="absolute bottom-0 flex items-start justify-center overflow-hidden rounded-t-md border-t-2 border-[color:var(--tone-teal)] bg-[color:var(--tone-teal-soft)] text-[10px] font-semibold text-[color:var(--tone-teal)]"
      style={{ left: at(step.from), width: `calc(${at(step.to)} - ${at(step.from)} - 2px)`, height: `${35 + 65 * (step.amount / max)}%` }}
    >
      {formatReported(step.amount)}
    </span>
  ))
}

function Dots({ lane, at }: { lane: Extract<TimelineLane, { kind: "points" }>; at: (week: number) => string }) {
  const values = lane.points.map((point) => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const decimals = decimalsFor(values)
  // A few values (lab results) get their number; daily check-ins are small dots.
  const labeled = lane.points.length <= 4
  return lane.points.map((point, index) => (
    <span
      key={index}
      title={`${weekLabel(Math.round(point.week))}: ${formatReported(point.value, decimals)} ${lane.unit}`}
      className={`absolute -translate-x-1/2 translate-y-1/2 rounded-full ${
        labeled ? "h-2.5 w-2.5 bg-[color:var(--tone-teal)]" : "h-1.5 w-1.5 bg-[color:var(--tone-stone)]"
      }`}
      style={{ left: at(point.week), bottom: max === min ? "50%" : `${10 + ((point.value - min) / (max - min)) * 80}%` }}
    >
      {labeled && (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-foreground">
          {formatReported(point.value, decimals)}
        </span>
      )}
    </span>
  ))
}
