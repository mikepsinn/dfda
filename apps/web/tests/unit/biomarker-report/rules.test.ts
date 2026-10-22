// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { clinicalResult, markerResult, panelResult, panelVerdict, summarizeReport } from '@/lib/biomarker-report/rules'
import { biomarkerReportSchema, type ClinicalValue, type Marker, type Panel } from '@/lib/biomarker-report/schema'

const marker = (values: (number | null)[], noise: number, intended: Marker['intended'], id = 'M'): Marker => ({
  id,
  name: id,
  unit: 'pg/mL',
  values,
  noise,
  intended,
})

const clinical = (first: number | null, last: number | null, better: ClinicalValue['better'], meaningfulChange: number): ClinicalValue => ({
  name: 'Value',
  unit: 'U/L',
  values: [first, last],
  better,
  meaningfulChange,
})

describe('markerResult', () => {
  it('calls a change of at least the threshold in the intended direction intended', () => {
    expect(markerResult(marker([640, 520, 430, 370], 90, 'down'), 1.5)).toEqual({
      first: 640,
      last: 370,
      change: -270,
      percentChange: -42.1875,
      noiseMultiple: 3,
      score: 3,
      status: 'intended',
    })
  })

  it('counts a change of exactly the threshold as a change', () => {
    expect(markerResult(marker([10, 11.5], 1, 'up'), 1.5)).toMatchObject({ noiseMultiple: 1.5, status: 'intended' })
    // 1.15 − 1 is 0.1499999999999999 in floating point.
    expect(markerResult(marker([1, 1.15], 0.1, 'up'), 1.5).status).toBe('intended')
  })

  it('calls a change below the threshold unchanged, in either direction', () => {
    expect(markerResult(marker([1.9, 1.8], 0.25, 'down'), 1.5)).toMatchObject({ status: 'unchanged' })
    expect(markerResult(marker([890, 985], 86, 'down'), 1.5)).toMatchObject({ status: 'unchanged' })
  })

  it('calls a change beyond the threshold in the other direction review, with a negative score', () => {
    const result = markerResult(marker([142, 118], 12, 'up'), 1.5)
    expect(result.status).toBe('review')
    expect(result.score).toBeCloseTo(-2)
  })

  it('compares only the first and the last timepoint', () => {
    expect(markerResult(marker([100, 300, 0, 100], 10, 'up'), 1.5)).toMatchObject({ change: 0, score: 0, status: 'unchanged' })
  })

  it('reports a marker without a first or last value as below the limit', () => {
    expect(markerResult(marker([null, null], 1, 'down'), 1.5)).toMatchObject({ change: null, score: null, status: 'below-limit' })
    expect(markerResult(marker([3, 4, null], 1, 'down'), 1.5).status).toBe('below-limit')
  })

  it('has no percent change from a first value of 0', () => {
    expect(markerResult(marker([0, 5], 1, 'up'), 1.5)).toMatchObject({ percentChange: null, status: 'intended' })
  })
})

describe('panels', () => {
  const panel = (markers: Marker[]): Panel => ({ id: 'p', name: 'Panel', summary: 'Summary', markers })

  it('averages the signed scores of the markers with values', () => {
    const result = panelResult(
      panel([marker([10, 7], 1, 'down', 'A'), marker([10, 9], 1, 'up', 'B'), marker([null, null], 1, 'down', 'C')]),
      1.5,
    )
    // A: +3 (intended); B: −1 (unchanged); C has no values.
    expect(result.index).toBe(1)
    expect(result.counts).toEqual({ intended: 1, unchanged: 1, review: 0, 'below-limit': 1 })
    expect(result.verdict).toBe('intended')
  })

  it('makes a panel with any review marker a panel to review, else intended, else unchanged', () => {
    expect(panelVerdict({ intended: 5, unchanged: 1, review: 1, 'below-limit': 0 })).toBe('review')
    expect(panelVerdict({ intended: 1, unchanged: 6, review: 0, 'below-limit': 1 })).toBe('intended')
    expect(panelVerdict({ intended: 0, unchanged: 6, review: 0, 'below-limit': 0 })).toBe('unchanged')
  })

  it('has no index when no marker has values', () => {
    expect(panelResult(panel([marker([null, null], 1, 'down')]), 1.5)).toMatchObject({ index: null, verdict: 'unchanged' })
  })
})

describe('clinicalResult', () => {
  it('judges a meaningful change by the better direction', () => {
    expect(clinicalResult(clinical(6.1, 5.6, 'lower', 5))).toMatchObject({ status: 'intended' })
    expect(clinicalResult(clinical(31, 36, 'lower', 15))).toMatchObject({ status: 'review' })
    expect(clinicalResult(clinical(26, 24, 'higher', 5))).toMatchObject({ status: 'review' })
  })

  it('counts a change of exactly the meaningful change as a change', () => {
    // (0.9 − 1) ÷ 1 is −0.09999999999999998 in floating point.
    expect(clinicalResult(clinical(1, 0.9, 'lower', 10)).status).toBe('intended')
  })

  it('calls a change smaller than the meaningful change unchanged, and a change without a better direction changed', () => {
    expect(clinicalResult(clinical(42, 38, 'lower', 30)).status).toBe('unchanged')
    expect(clinicalResult(clinical(0.82, 1.2, 'neither', 10)).status).toBe('changed')
  })

  it('reports missing values, and judges any change from 0 as meaningful', () => {
    expect(clinicalResult(clinical(null, null, 'lower', 20)).status).toBe('below-limit')
    expect(clinicalResult(clinical(0, 2, 'higher', 10))).toMatchObject({ percentChange: null, status: 'intended' })
  })

  it('calls a value below the lab limit at the first and the last timepoint unchanged', () => {
    expect(clinicalResult({ ...clinical(null, null, 'lower', 20), lowerLimit: 3 }).status).toBe('unchanged')
    expect(clinicalResult({ ...clinical(null, 4, 'lower', 20), lowerLimit: 3 }).status).toBe('below-limit')
  })
})

const reportInput = {
  version: 1,
  title: 'Report',
  reportDate: '2026-09-30',
  person: { name: 'A. B.' },
  program: { name: 'Program' },
  timepoints: [
    { label: 'Baseline', week: 0 },
    { label: 'Week 12', week: 12 },
  ],
  panels: [
    { id: 'one', name: 'One', summary: 'S', markers: [marker([10, 7], 1, 'down', 'A'), marker([10, 13], 1, 'down', 'B')] },
    { id: 'two', name: 'Two', summary: 'S', markers: [marker([5, 5.2], 1, 'up', 'A')] },
  ],
}

describe('summarizeReport', () => {
  it('adds up the statuses of all panels', () => {
    const summary = summarizeReport(biomarkerReportSchema.parse(reportInput))
    expect(summary.counts).toEqual({ intended: 1, unchanged: 1, review: 1, 'below-limit': 0, total: 3 })
    expect(summary.panels.map((panel) => panel.verdict)).toEqual(['review', 'unchanged'])
  })
})

describe('biomarkerReportSchema', () => {
  it('uses a threshold of 1.5 by default', () => {
    expect(biomarkerReportSchema.parse(reportInput).threshold).toBe(1.5)
  })

  it('needs one value per timepoint', () => {
    const input = { ...reportInput, panels: [{ ...reportInput.panels[0], markers: [marker([1, 2, 3], 1, 'up')] }] }
    expect(biomarkerReportSchema.safeParse(input).error?.issues[0].message).toBe('Give 2 values, one per timepoint.')
  })

  it('needs timepoints in order and marker ids that differ within a panel', () => {
    const unordered = { ...reportInput, timepoints: [reportInput.timepoints[1], reportInput.timepoints[0]] }
    expect(biomarkerReportSchema.safeParse(unordered).success).toBe(false)
    const twice = { ...reportInput, panels: [{ ...reportInput.panels[0], markers: [marker([1, 2], 1, 'up'), marker([1, 2], 1, 'up')] }] }
    expect(biomarkerReportSchema.safeParse(twice).error?.issues[0].message).toBe('Each marker in a panel needs its own id.')
  })
})
