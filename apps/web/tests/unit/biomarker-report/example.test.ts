// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { EXAMPLE_REPORT, fillTimepoints } from '@/lib/biomarker-report/example'
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

  it('covers every marker status, panel verdict and clinical status', () => {
    expect(summary.counts).toEqual({ intended: 8, unchanged: 9, review: 2, 'below-limit': 1, total: 20 })
    expect(new Set(summary.panels.map((panel) => panel.verdict))).toEqual(new Set(['intended', 'unchanged', 'review']))
    expect(new Set(summary.clinicalValues.map((value) => value.status))).toEqual(
      new Set(['intended', 'unchanged', 'review', 'below-limit']),
    )
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
