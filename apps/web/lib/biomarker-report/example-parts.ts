import { hash, seededRandom } from '@/lib/seeded-random'
import type { Marker } from './schema'

/**
 * The parts of the made-up example reports (example.ts, example-bpc-157.ts):
 * values for every timepoint from a marker's first and last values, so that a
 * report is written as its first and last values and each marker's change in
 * multiples of its noise.
 */

/** The share of a marker's noise by which a value between the first and the last timepoint may wobble. */
const WOBBLE = 0.3

function decimalsOf(value: number) {
  return (String(value).split('.')[1] ?? '').length
}

function round(value: number, decimals: number) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

/**
 * Values for every timepoint from the first and the last one: most of the
 * change comes early (as with a drug that acts within weeks), plus a small
 * wobble within the noise. The same seed always gives the same values, rounded
 * to as many decimals as the first and last values have.
 */
export function fillTimepoints(options: { first: number; last: number; weeks: number[]; noise: number; seed: string }): number[] {
  const { first, last, weeks, noise } = options
  const random = seededRandom(hash(options.seed))
  const decimals = Math.max(decimalsOf(first), decimalsOf(last))
  const span = weeks[weeks.length - 1] - weeks[0]
  return weeks.map((week, index) => {
    if (index === 0) return first
    if (index === weeks.length - 1) return last
    const share = 1 - (1 - (week - weeks[0]) / span) ** 2
    const wobble = (random() * 2 - 1) * WOBBLE * noise
    return round(first + (last - first) * share + wobble, decimals)
  })
}


/**
 * A marker with its first and last values and its change in multiples of the
 * noise; null values when the assay never quantified it.
 */
export type MarkerSpec = Omit<Marker, 'values' | 'noise'> & { first: number | null; last: number | null; multiple: number }

/** A marker of a panel at the report's weeks, with the noise that makes its change `multiple` times the noise. */
export function exampleMarker(panelId: string, { first, last, multiple, ...spec }: MarkerSpec, weeks: number[]): Marker {
  // The noise that makes the change this many times the noise, to 4 significant digits as a data file gives it.
  const noise = first === null || last === null ? 1 : Number((Math.abs(last - first) / multiple).toPrecision(4))
  const values =
    first === null || last === null ? weeks.map(() => null) : fillTimepoints({ first, last, weeks, noise, seed: `example:${panelId}:${spec.id}` })
  return { ...spec, noise, values }
}

/** A clinical value measured at the first and the last timepoint only. */
export function notMeasuredBetween(first: number | null, last: number | null, count: number): (number | null)[] {
  return [first, ...Array.from({ length: count - 2 }, () => null), last]
}
