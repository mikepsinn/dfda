"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

/**
 * A rating on a scale, such as 0 to 10, as one button for each number. The
 * buttons are radio buttons, so the arrow keys move between them. "Clear"
 * removes the rating, and then the form sends no value.
 */
export function RatingInput({
  name,
  label,
  min,
  max,
  words,
  defaultValue,
}: {
  name: string
  label: string
  min: number
  max: number
  words: [low: string, high: string] | null
  defaultValue?: number | null
}) {
  const [value, setValue] = useState<number | null>(defaultValue ?? null)
  const numbers = Array.from({ length: max - min + 1 }, (_, index) => min + index)
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="grid max-w-md gap-1" style={{ gridTemplateColumns: `repeat(${numbers.length}, minmax(0, 1fr))` }}>
        {numbers.map((number) => (
          <label key={number}>
            <input
              type="radio"
              name={name}
              value={number}
              checked={value === number}
              onChange={() => setValue(number)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex h-10 cursor-pointer items-center justify-center rounded-md border border-input bg-background text-sm font-medium tabular-nums",
                "hover:bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2",
                "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground",
              )}
            >
              {number}
            </span>
          </label>
        ))}
      </div>
      <div className="mt-1 flex min-h-5 max-w-md items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{words && `${min} = ${words[0]}`}</span>
        {value !== null && (
          <button type="button" onClick={() => setValue(null)} className="underline">
            Clear
          </button>
        )}
        <span>{words && `${max} = ${words[1]}`}</span>
      </div>
    </fieldset>
  )
}
