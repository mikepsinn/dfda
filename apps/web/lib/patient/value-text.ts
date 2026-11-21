import { getRatingRange, getVariableInputType } from '@/lib/variable-helpers'

/** A value in words for buttons, toasts and charts: "Yes", "4 of 5", or the number with its unit. */
export function valueText(value: number, unit: { id: string; abbreviatedName: string }) {
  const inputType = getVariableInputType({ unitId: unit.id, variableCategory: null })
  if (inputType === 'boolean_yes_no') return value ? 'Yes' : 'No'
  const range = getRatingRange(inputType)
  if (range) return `${value} of ${range[1]}`
  return unit.abbreviatedName ? `${value} ${unit.abbreviatedName}` : String(value)
}
