import { decimalsFor, formatReported } from "@/lib/biomarker-report/format"
import { TONE_CLASSES, type Tone } from "@/components/status-tone"

const WIDTH = 84
const HEIGHT = 24
const PAD = 4

/**
 * A small line of a value over the timepoints, in the tone of its status: open
 * dots, and a filled dot for the last value. The values are also in the
 * accessible name; a timepoint without a value is left out. The values have
 * the decimals of the most precise one, as in the tables.
 */
export function Sparkline({
  values,
  weeks,
  labels,
  tone = "teal",
}: {
  values: (number | null)[]
  weeks: number[]
  labels: string[]
  tone?: Tone
}) {
  const points = values.flatMap((value, index) => (value === null ? [] : [{ value, week: weeks[index], label: labels[index] }]))
  if (points.length < 2) return null

  const min = Math.min(...points.map((point) => point.value))
  const max = Math.max(...points.map((point) => point.value))
  const first = weeks[0]
  const span = weeks[weeks.length - 1] - first || 1
  const x = (week: number) => PAD + ((week - first) / span) * (WIDTH - 2 * PAD)
  // A flat line sits in the middle.
  const y = (value: number) => (max === min ? HEIGHT / 2 : PAD + ((max - value) / (max - min)) * (HEIGHT - 2 * PAD))
  const decimals = decimalsFor(values)
  const name = points.map((point) => `${point.label} ${formatReported(point.value, decimals)}`).join(", ")
  const color = TONE_CLASSES[tone].stroke

  return (
    <svg role="img" aria-label={name} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT}>
      <polyline
        points={points.map((point) => `${x(point.week)},${y(point.value)}`).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth={1.25}
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <circle
          key={point.label}
          cx={x(point.week)}
          cy={y(point.value)}
          r={index === points.length - 1 ? 2.75 : 2.25}
          fill={index === points.length - 1 ? color : "var(--report-card)"}
          stroke={color}
          strokeWidth={1}
        />
      ))}
    </svg>
  )
}
