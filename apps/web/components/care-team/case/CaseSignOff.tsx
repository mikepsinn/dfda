"use client"

import { useActionState, useState } from "react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Problems, Submit, type Action } from "@/components/care-team/CareForms"
import { REVIEW_DECISIONS } from "@/lib/care-team/format"

/**
 * The Decide chapter's sign-off: the note starts as a draft from the report's
 * numbers, which the clinician edits; they choose a decision for the care plan
 * and confirm their review before they sign off.
 */
export function CaseSignOff({ action, draft, title }: { action: Action; draft: string; title: string }) {
  const [state, formAction, pending] = useActionState(action, {})
  const [edited, setEdited] = useState(false)
  const [reviewed, setReviewed] = useState(false)

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="from" value="case" />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Clinician note</p>
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <span
          aria-live="polite"
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            reviewed ? "bg-primary text-primary-foreground" : edited ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
          }`}
        >
          {reviewed ? "Reviewed by clinician" : edited ? "Edited by clinician" : "Draft from the report"}
        </span>
      </div>
      <Problems state={state} />
      <div className="space-y-2">
        <Label htmlFor="case-note">Note for the person</Label>
        <Textarea
          id="case-note"
          name="note"
          rows={5}
          maxLength={2000}
          defaultValue={draft}
          onChange={() => setEdited(true)}
          className="text-sm leading-relaxed"
        />
        <p className="text-xs text-muted-foreground">The draft lists what the report shows. Add your plan; the person sees the note with your name.</p>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Decision for the care plan</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(REVIEW_DECISIONS).map(([value, decision]) => (
            <label key={value} className="flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm has-[:checked]:border-primary">
              <input type="radio" name="decision" value={value} required className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
              <span>
                <span className="block font-medium">{decision.label}</span>
                <span className="block text-muted-foreground">{decision.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium">
        <input
          type="checkbox"
          required
          checked={reviewed}
          onChange={(event) => setReviewed(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 shrink-0 rounded-full bg-muted transition-colors peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-ring after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-background after:shadow after:transition-transform peer-checked:after:translate-x-5"
        />
        I reviewed this report and the note
      </label>
      <Submit pending={pending}>Sign off</Submit>
    </form>
  )
}
