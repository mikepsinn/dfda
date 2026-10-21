import type { ClinicalStatus, PanelVerdict } from './rules'

function decimalsOf(value: number) {
  const text = String(value)
  return text.includes('e') ? 3 : (text.split('.')[1] ?? '').length
}

/**
 * The number of decimals for a row of values: as many as the most precise
 * value has (at most 3), so that 6.0 and 5.5 show as "6.0" and "5.5".
 */
export function decimalsFor(values: (number | null)[]): number {
  return Math.min(3, Math.max(0, ...values.flatMap((value) => (value === null ? [] : [decimalsOf(value)]))))
}

/** A measured value with thousands separators: "1,120", "0.84", "104.2". */
export function formatMeasured(value: number, decimals = Math.min(3, decimalsOf(value))): string {
  return value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

/** A value, "< limit" for a value below the assay's limit, or "–" when there is none. */
export function formatMeasuredOrMissing(value: number | null, lowerLimit?: number, decimals?: number): string {
  if (value !== null) return formatMeasured(value, decimals)
  return lowerLimit === undefined ? '–' : `< ${formatMeasured(lowerLimit)}`
}

/** A noise multiple, for example "2.4×". */
export function formatMultiple(value: number): string {
  return `${value.toFixed(1)}×`
}

/** A panel index with its sign, for example "+2.8×" or "−1.4×". */
export function formatIndex(value: number): string {
  const text = Math.abs(value).toFixed(1)
  if (text === '0.0') return '0.0×'
  return `${value > 0 ? '+' : '−'}${text}×`
}

export const STATUS_LABELS: Record<ClinicalStatus, string> = {
  intended: 'Intended direction',
  unchanged: 'Unchanged',
  review: 'Review',
  'below-limit': 'Below limit',
  changed: 'Changed',
}

export const VERDICT_LABELS: Record<PanelVerdict, string> = {
  intended: 'Intended direction',
  unchanged: 'Unchanged',
  review: 'Review',
}

/** A report date ("2026-09-30") as "Sep 30, 2026". */
export function formatReportDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  )
}
