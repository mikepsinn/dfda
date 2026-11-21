import { getRatingRange, getVariableInputType } from '@/lib/variable-helpers'

/** A value in words for buttons, toasts and charts: "Yes", "4 of 5", or the number with its unit. */
export function valueText(value: number, unit: { id: string; abbreviatedName: string }) {
  const inputType = getVariableInputType({ unitId: unit.id, variableCategory: null })
  if (inputType === 'boolean_yes_no') return value ? 'Yes' : 'No'
  const range = getRatingRange(inputType)
  if (range) return `${value} of ${range[1]}`
  return unit.abbreviatedName ? `${value} ${unit.abbreviatedName}` : String(value)
}

/**
 * A computed number for display: two decimals, or three significant digits
 * below one, so that 0.081 g stays 0.081 and 5.40845 shows as 5.41. The value
 * itself is not rounded.
 */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  const shown = Math.abs(value) < 1 && value !== 0 ? Number(value.toPrecision(3)) : Number(value.toFixed(2))
  return String(shown)
}

/**
 * An average, sum or other value computed from measurements, for statistics
 * and charts: yes/no as the share of yes ("40% yes"), a rating as "5.41 of
 * 10", or the number with its unit. valueText is for one recorded answer.
 */
export function aggregateText(value: number, unit: { id: string; abbreviatedName: string }) {
  const inputType = getVariableInputType({ unitId: unit.id, variableCategory: null })
  if (inputType === 'boolean_yes_no') return `${formatNumber(value * 100)}% yes`
  const range = getRatingRange(inputType)
  if (range) return `${formatNumber(value)} of ${range[1]}`
  return unit.abbreviatedName ? `${formatNumber(value)} ${unit.abbreviatedName}` : formatNumber(value)
}

