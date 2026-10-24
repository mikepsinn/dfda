"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * A dose with a usual amount: one button records the usual amount, and
 * "Other amount" opens a number field. Off at first, so that a saved day has
 * a dose only when the person says that they took it.
 */
export function DoseInput({
  id,
  name,
  label,
  unit,
  usual,
  defaultValue,
}: {
  id: string
  name: string
  label: string
  unit: string
  usual: number
  /** The amount to show as taken, from a check-in link. */
  defaultValue?: number | null
}) {
  const given = defaultValue ?? null
  const [taken, setTaken] = useState(given !== null)
  const [other, setOther] = useState(given !== null && given !== usual)
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant={taken ? "default" : "outline"}
          aria-pressed={taken}
          onClick={() => setTaken(!taken)}
          className="gap-2"
        >
          {taken && <Check aria-hidden="true" className="h-4 w-4" />}
          Took my dose{other ? "" : ` (${usual} ${unit})`}
        </Button>
        {taken && !other && (
          <button type="button" onClick={() => setOther(true)} className="text-sm text-muted-foreground underline">
            Other amount
          </button>
        )}
      </div>
      {taken && !other && <input type="hidden" name={name} value={usual} />}
      {taken && other && (
        <div className="flex items-center gap-2">
          <Input
            id={id}
            name={name}
            type="number"
            step="any"
            inputMode="decimal"
            min={0}
            defaultValue={given ?? undefined}
            aria-label={`${label} amount (${unit})`}
            className="w-32"
            required
          />
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      )}
    </fieldset>
  )
}
