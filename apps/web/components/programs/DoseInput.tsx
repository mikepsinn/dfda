"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Answer = "took" | "skipped" | null

/**
 * A dose with a usual amount, as "Took it" and "Skipped" buttons. "Took it"
 * records the usual amount, or another amount; "Skipped" records 0, so that
 * the care team can tell a skipped dose from a day that nobody recorded.
 * Neither at first; tapping the chosen button again clears the answer.
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
  /** The amount to show as chosen, from a check-in link: 0 is skipped. */
  defaultValue?: number | null
}) {
  const given = defaultValue ?? null
  const [answer, setAnswer] = useState<Answer>(given === null ? null : given === 0 ? "skipped" : "took")
  const [other, setOther] = useState(given !== null && given !== 0 && given !== usual)
  const choose = (next: Exclude<Answer, null>) => setAnswer(answer === next ? null : next)
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{label}</legend>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={answer === "took" ? "default" : "outline"}
          aria-pressed={answer === "took"}
          onClick={() => choose("took")}
          className="gap-2"
        >
          {answer === "took" && <Check aria-hidden="true" className="h-4 w-4" />}
          Took it{other ? "" : ` (${usual} ${unit})`}
        </Button>
        <Button
          type="button"
          variant={answer === "skipped" ? "default" : "outline"}
          aria-pressed={answer === "skipped"}
          onClick={() => choose("skipped")}
          className="gap-2"
        >
          {answer === "skipped" && <Check aria-hidden="true" className="h-4 w-4" />}
          Skipped
        </Button>
        {answer === "took" && !other && (
          <button type="button" onClick={() => setOther(true)} className="text-sm text-muted-foreground underline">
            Other amount
          </button>
        )}
      </div>
      {answer === "skipped" && <input type="hidden" name={name} value={0} />}
      {answer === "took" && !other && <input type="hidden" name={name} value={usual} />}
      {answer === "took" && other && (
        <div className="mt-2 flex items-center gap-2">
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
