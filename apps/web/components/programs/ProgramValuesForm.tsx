"use client"

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ValuesFormState } from "@/lib/actions/programs"
import { DoseInput } from "./DoseInput"
import { RatingInput } from "./RatingInput"

/**
 * One field of the form. A rating (`scale`) shows a button for each number;
 * a dose with a usual amount (`usual`) shows a "Took my dose" button; other
 * values show a number field.
 */
export type ValueField = {
  id: string
  name: string
  unit: string
  kind: "dose" | "check_in" | "lab"
  usual?: number | null
  scale?: { min: number; max: number; words: [low: string, high: string] | null } | null
}

/** A form for one day's values of a program: lab results, or doses and check-ins. */
export function ProgramValuesForm({
  action,
  fields,
  defaultDate,
  dateLabel,
  submitLabel,
  fixedDate = false,
  initialValues = {},
}: {
  action: (state: ValuesFormState, formData: FormData) => Promise<ValuesFormState>
  fields: ValueField[]
  defaultDate: string
  dateLabel: string
  submitLabel: string
  /** The day is given (a check-in link), so there is no date field. */
  fixedDate?: boolean
  /** Values to show at first, by field id (from a check-in link). */
  initialValues?: Record<string, number>
}) {
  const [state, dispatch, pending] = useActionState(action, {})
  // A save clears the fields for the next day; an error keeps the answers.
  const [round, setRound] = useState(0)
  useEffect(() => {
    if (state.saved) setRound((previous) => previous + 1)
  }, [state])
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => dispatch(data))
  }
  return (
    <form onSubmit={submit} className="space-y-6">
      {state.error && (
        <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
          {state.error}
        </p>
      )}
      {state.saved && !pending && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Saved {state.saved} {state.saved === 1 ? "value" : "values"}.
        </p>
      )}
      {fixedDate ? (
        // `hidden` keeps the field out of the spacing between the fields.
        <input type="hidden" hidden name="date" value={defaultDate} />
      ) : (
        <div className="space-y-2">
          <Label htmlFor={`date-${fields[0]?.id}`}>{dateLabel}</Label>
          <Input id={`date-${fields[0]?.id}`} name="date" type="date" defaultValue={defaultDate} className="w-44" required />
        </div>
      )}
      <div key={round} className="grid gap-6 sm:grid-cols-2">
        {fields.map((field) => {
          const name = `value-${field.id}`
          // The answers of a check-in link, until the first save.
          const initial = round === 0 ? initialValues[field.id] : undefined
          if (field.scale) {
            return (
              <div key={field.id} className="sm:col-span-2">
                <RatingInput
                  name={name}
                  label={field.name}
                  min={field.scale.min}
                  max={field.scale.max}
                  words={field.scale.words}
                  defaultValue={initial}
                />
              </div>
            )
          }
          if (field.kind === "dose" && field.usual != null) {
            return (
              <div key={field.id} className="sm:col-span-2">
                <DoseInput
                  id={`value-${field.id}`}
                  name={name}
                  label={field.name}
                  unit={field.unit}
                  usual={field.usual}
                  defaultValue={initial}
                />
              </div>
            )
          }
          return (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={`value-${field.id}`}>
                {field.name} <span className="font-normal text-muted-foreground">({field.unit})</span>
              </Label>
              <Input
                id={`value-${field.id}`}
                name={name}
                type="number"
                step="any"
                inputMode="decimal"
                min={field.kind === "dose" ? 0 : undefined}
                defaultValue={initial}
              />
            </div>
          )
        })}
      </div>
      <Button type="submit" disabled={pending} className="gap-2">
        {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}
