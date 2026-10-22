// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  decimalsFor,
  formatIndex,
  formatMeasured,
  formatMeasuredOrMissing,
  formatReported,
  formatMultiple,
  formatReportDate,
} from '@/lib/biomarker-report/format'

describe('biomarker report formats', () => {
  it('shows a row of values with the decimals of its most precise value', () => {
    expect(decimalsFor([6, null, null, 5.5])).toBe(1)
    expect(decimalsFor([0.84, 0.86])).toBe(2)
    expect(decimalsFor([null, null])).toBe(0)
    expect(formatMeasured(6, 1)).toBe('6.0')
    expect(formatMeasured(1120)).toBe('1,120')
    expect(formatMeasured(104.2)).toBe('104.2')
  })

  it('shows a value below the limit as "< limit", and no value as "–"', () => {
    expect(formatMeasuredOrMissing(null, 3)).toBe('< 3')
    expect(formatMeasuredOrMissing(null)).toBe('–')
    expect(formatMeasuredOrMissing(2.5, undefined, 2)).toBe('2.50')
  })

  it('shows a value below 100 with at least one decimal, as the printed report does', () => {
    expect(formatReported(108, 0)).toBe('108')
    expect(formatReported(94, 0)).toBe('94.0')
    expect(formatReported(0.84, 2)).toBe('0.84')
    expect(formatReported(1)).toBe('1.0')
    expect(formatReported(1120)).toBe('1,120')
    expect(formatMeasuredOrMissing(42, undefined, 0)).toBe('42.0')
  })

  it('signs a panel index and shows a noise multiple with one decimal', () => {
    expect(formatIndex(2.4937)).toBe('+2.5×')
    expect(formatIndex(-1.6146)).toBe('−1.6×')
    expect(formatIndex(-0.04)).toBe('0.0×')
    expect(formatMultiple(2.142857)).toBe('2.1×')
  })

  it('shows the report date without a time zone shift', () => {
    expect(formatReportDate('2026-09-30')).toBe('30 Sep 2026')
  })
})
