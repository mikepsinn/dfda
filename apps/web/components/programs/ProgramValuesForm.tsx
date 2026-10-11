"use client"

import { useActionState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ValuesFormState } from "@/lib/actions/programs"

export type ValueField = { id: string; name: string; unit: string; defaultValue?: number | null; min?: number; max?: number }

/** A form for one day's values of a program: lab results, or doses and check-ins. */
export function ProgramValuesForm({
  action,
  fields,
  defaultDate,
  dateLabel,
  submitLabel,
}: {
  action: (state: ValuesFormState, formData: FormData) => Promise<ValuesFormState>
  fields: ValueField[]
  defaultDate: string
  dateLabel: string
  submitLabel: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  return (
    <form action={formAction} className="space-y-4">
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
      <div className="space-y-2">
        <Label htmlFor={`date-${fields[0]?.id}`}>{dateLabel}</Label>
        <Input id={`date-${fields[0]?.id}`} name="date" type="date" defaultValue={defaultDate} className="w-44" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={`value-${field.id}`}>
              {field.name} <span className="font-normal text-muted-foreground">({field.unit})</span>
            </Label>
            <Input
              id={`value-${field.id}`}
              name={`value-${field.id}`}
              type="number"
              step="any"
              inputMode="decimal"
              min={field.min}
              max={field.max}
              defaultValue={field.defaultValue ?? undefined}
            />
          </div>
        ))}
      </div>
      <Button type="submit" disabled={pending} className="gap-2">
        {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}
