import type { ItemKind, Frequency } from './config'
import { buildPersonReport, programTotals, type PersonReport, type Point, type ReportItem } from './report'
import { hash, seededRandom } from '@/lib/seeded-random'

/**
 * Made-up people for a program, to show what the report and the company
 * dashboard look like before real people join. The numbers are invented
 * (rough, illustrative sizes), never stored, and never used as evidence: the
 * company's dashboard shows them under "Sample data". The same program always
 * gets the same people, so the page does not change on each load.
 */

export const SAMPLE_SIZE = 30
/** Of the sample people, this many joined less than a week ago and have no second value yet. */
const RECENT_JOINERS = 4
const DAY = 86_400_000

function normal(random: () => number, mean: number, sd: number) {
  const u = Math.max(random(), 1e-12)
  const v = random()
  return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

type Shape = {
  base: [mean: number, sd: number]
  /** The change by the follow-up: an amount, or a share of the starting value when `relative`. */
  change: [mean: number, sd: number]
  relative?: boolean
  /** Day-to-day noise of a check-in, in the variable's unit. */
  noise: number
  min: number
  max: number
  decimals: number
}

const scale = (base: number, change: number): Shape => ({
  base: [base, 1.5],
  change: [change, 1.5],
  noise: 1,
  min: 0,
  max: 10,
  decimals: 0,
})

// Illustrative sizes for the template variables; not taken from studies.
const SHAPES: Record<string, Shape> = {
  weight: { base: [98, 16], change: [-0.1, 0.05], relative: true, noise: 0.6, min: 45, max: 250, decimals: 1 },
  'energy-level': scale(5, 1.2),
  nausea: { ...scale(0.8, 0.5), base: [0.8, 0.8] },
  fatigue: scale(4, -0.5),
  pain: scale(5.5, -1.6),
  hba1c: { base: [6, 0.5], change: [-0.5, 0.3], noise: 0, min: 4.2, max: 12, decimals: 1 },
  'alanine-aminotransferase': { base: [32, 10], change: [-6, 8], noise: 0, min: 7, max: 150, decimals: 0 },
  'apolipoprotein-b': { base: [100, 20], change: [-9, 12], noise: 0, min: 40, max: 200, decimals: 0 },
  ferritin: { base: [130, 45], change: [-12, 25], noise: 0, min: 15, max: 500, decimals: 0 },
  'c-reactive-protein': { base: [2.8, 1.6], change: [-0.7, 1], noise: 0, min: 0.2, max: 15, decimals: 1 },
}

function shapeFor(variableId: string, unitId: string): Shape {
  if (SHAPES[variableId]) return SHAPES[variableId]
  if (unitId === 'zero-to-ten-scale' || unitId === 'one-to-ten-scale') return scale(5, 0)
  return { base: [100, 15], change: [0, 0.06], relative: true, noise: 2, min: 0, max: 1e6, decimals: 1 }
}

const clamp = (value: number, shape: Shape) => {
  const factor = 10 ** shape.decimals
  return Math.round(Math.min(shape.max, Math.max(shape.min, value)) * factor) / factor
}

export type SampleItem = { variableId: string; unitId: string; kind: ItemKind; frequency?: Frequency | null }
export type SamplePerson = { label: string; startedAt: Date; series: Map<string, Point[]> }

export function sampleCohort(options: {
  seedKey: string
  items: SampleItem[]
  followUpWeeks: number
  now: Date
  size?: number
}): SamplePerson[] {
  const random = seededRandom(hash(options.seedKey))
  const programDays = options.followUpWeeks * 7
  // Whole days, so the dates do not move during a day.
  const today = Math.floor(options.now.getTime() / DAY) * DAY
  const size = options.size ?? SAMPLE_SIZE

  return Array.from({ length: size }, (_, index) => {
    const recent = index >= size - RECENT_JOINERS
    const daysAgo = recent ? 1 + Math.floor(random() * 5) : programDays + 1 + Math.floor(random() * 60)
    const startedAt = new Date(today - daysAgo * DAY)
    const series = new Map<string, Point[]>()

    for (const item of options.items) {
      if (item.kind === 'dose') continue
      const shape = shapeFor(item.variableId, item.unitId)
      const base = normal(random, ...shape.base)
      const draw = normal(random, ...shape.change)
      const change = shape.relative ? base * draw : draw
      const valueAt = (day: number, noise: number) =>
        clamp(base + change * Math.min(1, Math.max(0, day) / programDays) + normal(random, 0, noise), shape)
      const points: Point[] = []
      const lastDay = Math.min(programDays, daysAgo)

      if (item.kind === 'lab') {
        points.push({ at: new Date(startedAt.getTime() - 2 * DAY), value: valueAt(0, 0) })
        if (daysAgo >= programDays) points.push({ at: new Date(startedAt.getTime() + programDays * DAY), value: valueAt(programDays, 0) })
      } else {
        const step = item.frequency === 'weekly' ? 7 : 1
        for (let day = 0; day <= lastDay; day += step) {
          // People miss some daily check-ins.
          if (step === 1 && random() < 0.15) continue
          points.push({ at: new Date(startedAt.getTime() + day * DAY), value: valueAt(day, shape.noise) })
        }
      }
      series.set(item.variableId, points)
    }
    return { label: `Sample person ${index + 1}`, startedAt, series }
  })
}

/**
 * The sample view of a program: totals over the sample people, and the report
 * of a typical finished sample person (the median number of improved
 * measures) as an example.
 */
export function sampleView(
  program: { id: string; followUpWeeks: number; items: SampleItem[] },
  items: ReportItem[],
  now = new Date(),
) {
  const people = sampleCohort({ seedKey: program.id, items: program.items, followUpWeeks: program.followUpWeeks, now })
  const reports = people.map((person) => buildPersonReport(items, person.series, person.startedAt, program.followUpWeeks))
  const finished = reports.filter((report) => report.measures.every((measure) => measure.status !== 'waiting'))
  const improved = (report: PersonReport) => report.measures.filter((measure) => measure.status === 'improved').length
  const counts = finished.map(improved).sort((a, b) => a - b)
  const median = counts[Math.floor(counts.length / 2)]
  const example = finished.find((report) => improved(report) === median) ?? reports[0]
  return { enrolled: people.length, totals: programTotals(items, reports), example }
}
