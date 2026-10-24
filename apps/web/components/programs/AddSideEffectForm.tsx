"use client"

import { startTransition, useActionState, useEffect, useMemo, useState, type FormEvent } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SideEffectFormState } from "@/lib/actions/programs"
import { scaleWords } from "@/lib/programs/config"
import type { SideEffectOption } from "@/lib/programs/side-effects"
import { RatingInput } from "./RatingInput"

/**
 * Starts to track a side effect: a symptom from the list (its name or another
 * name) gets a daily reminder, and today's rating when the member gives one.
 * Then the daily check-in asks for it.
 */
export function AddSideEffectForm({
  action,
  options,
  date,
}: {
  action: (state: SideEffectFormState, formData: FormData) => Promise<SideEffectFormState>
  options: SideEffectOption[]
  /** Today, for the rating. */
  date: string
}) {
  const [state, dispatch, pending] = useActionState(action, {})
  const [name, setName] = useState("")
  const byName = useMemo(() => {
    const map = new Map<string, SideEffectOption>()
    for (const option of options) map.set(option.name.toLowerCase(), option)
    for (const option of options) {
      for (const synonym of option.synonyms) if (!map.has(synonym.toLowerCase())) map.set(synonym.toLowerCase(), option)
    }
    return map
  }, [options])
  const match = byName.get(name.trim().toLowerCase()) ?? null

  // A new side effect clears the form for the next one.
  useEffect(() => {
    if (state.added) setName("")
  }, [state])

  // Sent in a transition, so that an error keeps the answers.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    startTransition(() => dispatch(data))
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {state.error && (
        <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
          {state.error}
        </p>
      )}
      {state.added && !pending && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          Added {state.added}. You get a reminder to rate it each day.
        </p>
      )}
      <input type="hidden" hidden name="date" value={date} />
      <input type="hidden" hidden name="variableId" value={match?.id ?? ""} />
      <div className="max-w-md space-y-2">
        <Label htmlFor="side-effect-name">Side effect</Label>
        <Input
          id="side-effect-name"
          list="side-effect-options"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="For example, headache"
          autoComplete="off"
        />
        <datalist id="side-effect-options">
          {options.map((option) => (
            <option key={option.id} value={option.name} />
          ))}
          {options.flatMap((option) =>
            option.synonyms.map((synonym) => <option key={`${option.id}:${synonym}`} value={synonym} label={option.name} />),
          )}
        </datalist>
        {name.trim() && !match && <p className="text-sm text-muted-foreground">Choose a side effect from the list.</p>}
      </div>
      {match && (
        <RatingInput
          key={match.id}
          name="value"
          label={`${match.name} today`}
          min={match.scale[0]}
          max={match.scale[1]}
          words={scaleWords("lower", match.scale[0])}
        />
      )}
      <Button type="submit" variant="outline" disabled={pending || !match} className="gap-2">
        {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
        Add the side effect
      </Button>
    </form>
  )
}
