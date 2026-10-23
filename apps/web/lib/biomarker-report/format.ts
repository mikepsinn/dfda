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

/**
 * A measured value as the report shows it: with the decimals of its row (decimalsFor),
 * and at least one below 100, so that a row reads "108" then "94.0" and a dose "1.0 mg".
 */
export function formatReported(value: number, decimals = Math.min(3, decimalsOf(value))): string {
  return formatMeasured(value, Math.max(decimals, Math.abs(value) < 100 ? 1 : 0))
}

/**
 * A value (formatReported), "< limit" for a value below the assay's limit, or
 * `missing` when there is none: "–" by default, "< LLOQ" for a marker that the
 * assay did not quantify.
 */
export function formatMeasuredOrMissing(value: number | null, lowerLimit?: number, decimals?: number, missing = '–'): string {
  if (value !== null) return formatReported(value, decimals)
  return lowerLimit === undefined ? missing : `< ${formatMeasured(lowerLimit)}`
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
  intended: 'Improved',
  unchanged: 'Unchanged',
  review: 'Review',
  'below-limit': 'Below LLOQ',
  changed: 'Changed',
}

export const VERDICT_LABELS: Record<PanelVerdict, string> = {
  intended: 'Improved',
  unchanged: 'Unchanged',
  review: 'Review',
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/**
 * A report date ("2026-06-12") as "12 Jun 2026", as on printed lab reports. Not
 * Intl: its short months differ between runtimes ("Sep" or "Sept").
 */
export function formatReportDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  return `${day} ${MONTHS[month - 1]} ${year}`
}

/** A timepoint label in short form for table heads: "Week 12" → "Wk 12". */
export function shortTimepoint(label: string): string {
  return label.replace(/^Week\s+/i, 'Wk ')
}
