"use client"

import { useActionState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CareFormState } from "@/lib/actions/care-team"

type Action = (state: CareFormState, formData: FormData) => Promise<CareFormState>

function Problems({ state }: { state: CareFormState }) {
  if (!state.error) return null
  return (
    <div role="alert" className="space-y-1 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
      <p className="font-medium">{state.error}</p>
      {state.errors && state.errors.length > 0 && (
        <ul className="list-disc space-y-0.5 pl-5">
          {state.errors.map((problem) => (
            <li key={problem} className="break-words">
              {problem}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <Button type="submit" disabled={pending} className="gap-2">
      {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}

/** Adds a report file (JSON in the biomarker report format) for one person. */
export function UploadReportForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {})
  return (
    <form action={formAction} className="space-y-3">
      <Problems state={state} />
      <div className="space-y-2">
        <Label htmlFor="report-file">Report file</Label>
        <Input id="report-file" name="file" type="file" accept="application/json,.json" required className="max-w-md" />
      </div>
      <Submit pending={pending}>Add the report</Submit>
    </form>
  )
}

/** Signs off a report, with an optional note for the person. */
export function SignOffForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {})
  return (
    <form action={formAction} className="space-y-3">
      <Problems state={state} />
      <div className="space-y-2">
        <Label htmlFor="review-note">Note for the person (optional)</Label>
        <Textarea id="review-note" name="note" rows={4} maxLength={2000} className="max-w-2xl" />
      </div>
      <Submit pending={pending}>Sign off</Submit>
    </form>
  )
}

/** Adds a clinician to the care team by the email of their account. */
export function AddClinicianForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {})
  return (
    <form action={formAction} className="space-y-3">
      <Problems state={state} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="clinician-email">Clinician&rsquo;s email</Label>
          <Input id="clinician-email" name="email" type="email" autoComplete="off" required />
        </div>
        <Submit pending={pending}>Add to the care team</Submit>
      </div>
    </form>
  )
}
