// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  buildPersonReport,
  compareMeasure,
  MIN_GROUP_SIZE,
  programTotals,
  verdictFor,
  weeklyTrend,
  type Point,
  type ReportItem,
} from '@/lib/programs/report'

const DAY = 86_400_000
const start = new Date('2026-06-01T12:00:00Z')
const at = (day: number, value: number): Point => ({ at: new Date(start.getTime() + day * DAY), value })

const weight: ReportItem = { variableId: 'weight', name: 'Weight', unitId: 'kilogram', unit: 'kg', kind: 'check_in', better: 'lower' }
const energy: ReportItem = { variableId: 'energy-level', name: 'Energy', unitId: 'zero-to-ten-scale', unit: '0-10', kind: 'check_in', better: 'higher' }
const ferritin: ReportItem = { variableId: 'ferritin', name: 'Ferritin', unitId: 'nanograms-per-milliliter', unit: 'ng/mL', kind: 'lab', better: 'neither' }

describe('compareMeasure', () => {
  it('compares the start with the latest values and judges the change by the better direction', () => {
    const result = compareMeasure([at(-2, 100), at(84, 90)], start, 'lower', 'kilogram')
    expect(result).toEqual({ before: 100, after: 90, change: -10, percentChange: -10, status: 'improved' })
    expect(compareMeasure([at(-2, 100), at(84, 110)], start, 'lower', 'kilogram').status).toBe('worse')
  })

  it('counts values up to a week after the start as the start, and means the last two weeks of each period', () => {
    const points = [at(0, 4), at(6, 6), at(60, 1), at(70, 7), at(84, 9)]
    // Before: days 0 and 6 (mean 5). Now: days 70 and 84, within 14 days of the last value (mean 8).
    expect(compareMeasure(points, start, 'higher', 'zero-to-ten-scale')).toMatchObject({ before: 5, after: 8, status: 'improved' })
  })

  it('ignores values from more than 90 days before the start', () => {
    expect(compareMeasure([at(-120, 100), at(30, 90)], start, 'lower', 'kilogram').status).toBe('waiting')
  })

  it('needs a 1-point change on a 0-10 scale and a 5% change otherwise', () => {
    expect(compareMeasure([at(0, 5), at(30, 5.8)], start, 'higher', 'zero-to-ten-scale').status).toBe('unchanged')
    expect(compareMeasure([at(0, 5), at(30, 6)], start, 'higher', 'zero-to-ten-scale').status).toBe('improved')
    expect(compareMeasure([at(0, 100), at(30, 96)], start, 'lower', 'kilogram').status).toBe('unchanged')
  })

  it('reports a change without a better direction as changed, and waits without a second value', () => {
    expect(compareMeasure([at(-1, 100), at(84, 70)], start, 'neither', 'nanograms-per-milliliter').status).toBe('changed')
    expect(compareMeasure([at(-1, 100)], start, 'lower', 'kilogram')).toMatchObject({ after: null, status: 'waiting' })
  })
})

describe('person report', () => {
  it('builds the measures, the follow-up date and a verdict that names what got worse', () => {
    const series = new Map([
      ['weight', [at(-1, 100), at(84, 90)]],
      ['energy-level', [at(1, 7), at(84, 4)]],
    ])
    const report = buildPersonReport([weight, energy, ferritin], series, start, 12)
    expect(report.followUpAt).toEqual(new Date(start.getTime() + 84 * DAY))
    expect(report.measures.map((measure) => measure.status)).toEqual(['improved', 'worse', 'waiting'])
    expect(report.verdict).toBe('1 of 2 measures improved. Energy got worse. 1 still needs a second value.')
  })

  it('says when there is nothing to compare yet', () => {
    expect(verdictFor(buildPersonReport([weight], new Map(), start, 12).measures)).toMatch(/^No comparison yet/)
  })
})

describe('program totals', () => {
  const reportFor = (before: number, after: number) =>
    buildPersonReport([weight], new Map([['weight', [at(0, before), at(84, after)]]]), start, 12)

  it('hides a measure until enough people have values at both times', () => {
    const reports = Array.from({ length: MIN_GROUP_SIZE - 1 }, () => reportFor(100, 90))
    expect(programTotals([weight], reports)[0]).toMatchObject({ people: MIN_GROUP_SIZE - 1, hidden: true, improved: 0, medianPercentChange: null })
  })

  it('counts each result and the median change', () => {
    const reports = [reportFor(100, 90), reportFor(100, 80), reportFor(100, 100), reportFor(100, 110), reportFor(100, 95)]
    expect(programTotals([weight], reports)[0]).toMatchObject({
      people: 5,
      hidden: false,
      improved: 3,
      unchanged: 1,
      worse: 1,
      medianPercentChange: -5,
    })
  })
})

describe('weeklyTrend', () => {
  it('gives the mean of each week since the start, with the values from before the start in week 0', () => {
    const trend = weeklyTrend([at(-3, 102), at(2, 100), at(8, 98), at(9, 96), at(22, 94)], start)
    expect(trend.weeks).toEqual([0, 1, 2, 3])
    expect(trend.values).toEqual([101, 97, null, 94])
  })

  it('leaves out values from before the lookback, and gives nothing without values', () => {
    expect(weeklyTrend([at(-200, 150), at(0, 100)], start).values).toEqual([100])
    expect(weeklyTrend([], start)).toEqual({ weeks: [], values: [] })
  })
})
