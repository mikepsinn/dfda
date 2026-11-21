'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getRatingRange } from '@/lib/variable-helpers'
import type { InboxVariable } from '@/lib/inbox/load'

// Faces for a 1–5 rating where 5 is best, as on QuantiModo's cards. For a
// symptom, where 5 is worst, they run the other way.
export const FACES = ['😞', '🙁', '😐', '🙂', '😀']

export function formatValue(value: number, unit: string) {
  return unit ? `${value} ${unit}` : String(value)
}

/** A recorded value in words: "Yes", "4 of 5", or the number with its unit. */
export function describeValue(variable: Pick<InboxVariable, 'inputType' | 'unit'>, value: number) {
  if (variable.inputType === 'boolean_yes_no') return value ? 'Yes' : 'No'
  const range = getRatingRange(variable.inputType)
  if (range) return `${value} of ${range[1]}`
  return formatValue(value, variable.unit.abbreviatedName)
}

/** The value buttons and fields of one variable, by its kind of input. Calls onRecord with the chosen value. */
export function ValueInput({ variable, disabled, onRecord, idPrefix }: {
  variable: InboxVariable
  disabled?: boolean
  onRecord: (value: number) => void
  idPrefix: string
}) {
  const [text, setText] = useState(variable.defaultValue === null ? '' : String(variable.defaultValue))
  const unit = variable.unit.abbreviatedName
  const range = getRatingRange(variable.inputType)

  if (variable.inputType === 'boolean_yes_no') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="outline" disabled={disabled} onClick={() => onRecord(0)}>No</Button>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => onRecord(1)}>Yes</Button>
      </div>
    )
  }

  if (variable.inputType === 'rating_1_5') {
    return (
      <div className="grid grid-cols-5 gap-2" role="group" aria-label={`${variable.name}, 1 to 5`}>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Button
            key={rating}
            type="button"
            variant="outline"
            disabled={disabled}
            onClick={() => onRecord(rating)}
            aria-label={`${rating} of 5`}
            className="h-auto flex-col gap-0.5 py-2"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              {FACES[variable.higherIsWorse ? 5 - rating : rating - 1]}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">{rating}</span>
          </Button>
        ))}
      </div>
    )
  }

  if (range) {
    const values = Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i)
    return (
      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`${variable.name}, ${range[0]} to ${range[1]}`}>
        {values.map((rating) => (
          <Button key={rating} type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onRecord(rating)}
            className="h-10 w-10 p-0 tabular-nums">
            {rating}
          </Button>
        ))}
      </div>
    )
  }

  const parsed = Number.parseFloat(text)
  const valid = text.trim() !== '' && Number.isFinite(parsed)
  return (
    <div className="space-y-2">
      {variable.presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {variable.presets.map((preset) => (
            <Button key={preset} type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => onRecord(preset)}
              className="tabular-nums">
              {formatValue(preset, unit)}
            </Button>
          ))}
        </div>
      )}
      <form
        className="flex items-center gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (valid) onRecord(parsed)
        }}
      >
        <label htmlFor={`${idPrefix}-value`} className="sr-only">{`${variable.name} in ${unit || 'units'}`}</label>
        <Input id={`${idPrefix}-value`} type="number" inputMode="decimal" step="any" value={text} disabled={disabled}
          onChange={(event) => setText(event.target.value)} placeholder="Other value" className="h-10 max-w-40" />
        {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        <Button type="submit" size="sm" disabled={disabled || !valid} className="ml-auto h-10 gap-1">
          <Check aria-hidden="true" className="h-4 w-4" /> Record
        </Button>
      </form>
    </div>
  )
}
