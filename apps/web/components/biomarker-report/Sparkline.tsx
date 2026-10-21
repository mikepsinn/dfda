import { decimalsFor, formatMeasured } from "@/lib/biomarker-report/format"

const WIDTH = 88
const HEIGHT = 28
const PAD = 4

/**
 * A small line of a value over the timepoints, in the instance's main color.
 * The values are also in the accessible name; a timepoint without a value is
 * left out. The last value has the larger dot. The values have the decimals of
 * the most precise one, as in the tables.
 */
export function Sparkline({
  values,
  weeks,
  labels,
}: {
  values: (number | null)[]
  weeks: number[]
  labels: string[]
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
  const name = points.map((point) => `${point.label} ${formatMeasured(point.value, decimals)}`).join(", ")

  return (
    <svg role="img" aria-label={name} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} className="text-primary">
      <polyline
        points={points.map((point) => `${x(point.week)},${y(point.value)}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {points.map((point, index) => (
        <circle
          key={point.label}
          cx={x(point.week)}
          cy={y(point.value)}
          r={index === points.length - 1 ? 3 : 2}
          fill={index === points.length - 1 ? "currentColor" : "hsl(var(--background))"}
          stroke="currentColor"
          strokeWidth={1.5}
        />
      ))}
    </svg>
  )
}
