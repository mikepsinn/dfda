// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { EXAMPLE_REPORT, exampleReportFor, fillTimepoints } from '@/lib/biomarker-report/example'
import { BPC_157_EXAMPLE_REPORT } from '@/lib/biomarker-report/example-bpc-157'
import { PROGRAM_TEMPLATES } from '@/lib/programs/config'
import { summarizeReport } from '@/lib/biomarker-report/rules'

describe('fillTimepoints', () => {
  const options = { first: 640, last: 370, weeks: [0, 4, 8, 12], noise: 90, seed: 'test' }

  it('keeps the first and last values and gives the same values for the same seed', () => {
    const values = fillTimepoints(options)
    expect(values[0]).toBe(640)
    expect(values[3]).toBe(370)
    expect(fillTimepoints(options)).toEqual(values)
    expect(fillTimepoints({ ...options, seed: 'other' })).not.toEqual(values)
  })

  it('puts most of the change early, within a small wobble of the noise, rounded like the given values', () => {
    const [, week4, week8] = fillTimepoints(options)
    // Without the wobble: 640 − 270 × 5/9 = 490, and 640 − 270 × 8/9 = 400.
    expect(Math.abs(week4 - 490)).toBeLessThanOrEqual(0.3 * 90 + 0.5)
    expect(Math.abs(week8 - 400)).toBeLessThanOrEqual(0.3 * 90 + 0.5)
    expect(Number.isInteger(week4)).toBe(true)
    expect(fillTimepoints({ ...options, first: 0.84, last: 0.86, noise: 0.06 }).every((value) => value === Number(value.toFixed(2)))).toBe(true)
  })
})

describe('the example report', () => {
  const summary = summarizeReport(EXAMPLE_REPORT)

  it('gives the totals and the panel counts of the clinician edition', () => {
    expect(summary.counts).toEqual({ intended: 21, unchanged: 41, review: 5, 'below-limit': 1, total: 68 })
    expect(Object.fromEntries(summary.panels.map((panel) => [panel.id, [panel.verdict, panel.counts.intended, panel.counts.unchanged, panel.counts.review]]))).toEqual({
      metabolic: ['intended', 10, 2, 0],
      inflammation: ['intended', 5, 5, 0],
      liver: ['intended', 4, 4, 0],
      cardiovascular: ['intended', 2, 6, 0],
      kidney: ['unchanged', 0, 6, 0],
      'muscle-bone': ['review', 0, 7, 4],
      gut: ['review', 0, 6, 1],
      neuro: ['unchanged', 0, 5, 0],
    })
    expect(new Set(summary.clinicalValues.map((value) => value.status))).toEqual(new Set(['intended', 'unchanged', 'review']))
  })

  it('shows no marker whose rounded noise multiple contradicts its status', () => {
    // A marker at 1.46× would show "1.5×" next to "unchanged".
    for (const panel of summary.panels) {
      for (const marker of panel.markers) {
        if (marker.noiseMultiple === null) continue
        const shown = Math.round(marker.noiseMultiple * 10) / 10
        expect({ id: marker.id, changed: shown >= EXAMPLE_REPORT.threshold }).toEqual({
          id: marker.id,
          changed: marker.status !== 'unchanged',
        })
      }
    }
  })
})

describe('the example report of each program template', () => {
  const template = (key: string) => PROGRAM_TEMPLATES.find((candidate) => candidate.key === key)!

  it("is chosen by the program's dose, and a program of another drug has none", () => {
    expect(exampleReportFor(template('glp-1'))).toBe(EXAMPLE_REPORT)
    expect(exampleReportFor(template('bpc-157'))).toBe(BPC_157_EXAMPLE_REPORT)
    expect(exampleReportFor({ items: [{ kind: 'dose', variableId: 'metformin' }] })).toBeNull()
    expect(exampleReportFor({ items: [{ kind: 'lab', variableId: 'bpc-157' }] })).toBeNull()
  })

  it('gives BPC-157 its own 8-week report: three timepoints, the dose in µg, and every status', () => {
    expect(BPC_157_EXAMPLE_REPORT.timepoints.map((timepoint) => timepoint.week)).toEqual([0, 4, 8])
    expect(BPC_157_EXAMPLE_REPORT.dose?.unit).toBe('µg')
    const summary = summarizeReport(BPC_157_EXAMPLE_REPORT)
    expect(summary.counts).toEqual({ intended: 8, unchanged: 35, review: 1, 'below-limit': 0, total: 44 })
    expect(summary.panels.find((panel) => panel.id === 'matrix')?.verdict).toBe('review')
    for (const panel of summary.panels) {
      for (const marker of panel.markers) {
        expect(marker.values).toHaveLength(3)
        if (marker.noiseMultiple === null) continue
        const shown = Math.round(marker.noiseMultiple * 10) / 10
        expect({ id: marker.id, changed: shown >= BPC_157_EXAMPLE_REPORT.threshold }).toEqual({ id: marker.id, changed: marker.status !== 'unchanged' })
      }
    }
  })
})
