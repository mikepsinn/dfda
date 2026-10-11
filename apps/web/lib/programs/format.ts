import type { MeasureStatus } from './report'

/** A measured value with as many decimals as its size needs: none from 100, one from 1, else two. */
export function formatValue(value: number): string {
  if (Number.isInteger(value)) return String(value)
  const size = Math.abs(value)
  const text = size >= 100 ? value.toFixed(0) : size >= 1 ? value.toFixed(1) : value.toFixed(2)
  return text.includes('.') ? text.replace(/\.?0+$/, '') : text
}

/** A change with its sign, for example "+1.2" or "−4". */
export function formatChange(value: number): string {
  if (value === 0) return '0'
  return `${value > 0 ? '+' : '−'}${formatValue(Math.abs(value))}`
}

export function formatPercent(value: number): string {
  const rounded = Math.round(value)
  return rounded === 0 ? '0%' : `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}%`
}

export const STATUS_LABELS: Record<MeasureStatus, string> = {
  improved: 'Improved',
  unchanged: 'No change',
  worse: 'Worse',
  changed: 'Changed',
  waiting: 'Waiting',
}

const DATE_FORMAT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function formatDate(date: Date): string {
  return DATE_FORMAT.format(date)
}
