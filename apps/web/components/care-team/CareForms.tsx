"use client"

import { useActionState, useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { CareFormState } from "@/lib/actions/care-team"
import { MAX_REPORT_FILE_BYTES, REVIEW_DECISIONS } from "@/lib/care-team/format"

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
  // Checked here too: a file over the server's body limit would not reach the action.
  const [tooLarge, setTooLarge] = useState(false)
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const file = new FormData(event.currentTarget).get("file")
        const large = file instanceof File && file.size > MAX_REPORT_FILE_BYTES
        setTooLarge(large)
        if (large) event.preventDefault()
      }}
      className="space-y-3"
    >
      <Problems state={tooLarge ? { error: "The file is larger than 900 KB." } : state} />
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
    <form action={formAction} className="space-y-4">
      <Problems state={state} />
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Decision for the care plan</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(REVIEW_DECISIONS).map(([value, decision]) => (
            <label key={value} className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm has-[:checked]:border-primary">
              <input type="radio" name="decision" value={value} required className="mt-0.5 h-4 w-4 shrink-0 accent-primary" />
              <span>
                <span className="block font-medium">{decision.label}</span>
                <span className="block text-muted-foreground">{decision.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="review-note">Note for the person (optional)</Label>
        <Textarea id="review-note" name="note" rows={4} maxLength={2000} className="max-w-2xl" />
      </div>
      <Submit pending={pending}>Sign off</Submit>
    </form>
  )
}

/** Invites a clinician to the care team by email. */
export function InviteClinicianForm({ action }: { action: Action }) {
  const [state, formAction, pending] = useActionState(action, {})
  return (
    <form action={formAction} className="space-y-3">
      <Problems state={state} />
      {state.notice && (
        <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary">
          <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> {state.notice}
        </p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="clinician-email">Clinician&rsquo;s email</Label>
          <Input id="clinician-email" name="email" type="email" autoComplete="off" required />
        </div>
        <Submit pending={pending}>Send the invitation</Submit>
      </div>
    </form>
  )
}

/** Creates an import key for the company's laboratory, and shows the new key once. */
export function ImportKeyForm({ action, endpoint }: { action: Action; endpoint: string }) {
  const [state, formAction, pending] = useActionState(action, {})
  const [copied, setCopied] = useState(false)
  return (
    <form action={formAction} className="space-y-3">
      <Problems state={state} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="import-key-name">Name of the key</Label>
          <Input id="import-key-name" name="name" maxLength={80} placeholder="Our laboratory" autoComplete="off" required />
        </div>
        <Submit pending={pending}>Create a key</Submit>
      </div>
      {state.key && (
        <div role="status" className="space-y-3 rounded-lg border border-primary/40 bg-primary/5 p-4 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <CheckCircle2 aria-hidden="true" className="h-4 w-4 text-primary" /> {state.notice}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input aria-label="New import key" value={state.key} readOnly className="font-mono text-xs" onFocus={(event) => event.target.select()} />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                void navigator.clipboard?.writeText(state.key!).then(() => setCopied(true))
              }}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-muted-foreground">
            Give the key to the laboratory in a safe way. It sends each report with <code>POST {endpoint}</code> and the
            header <code>Authorization: Bearer &lt;key&gt;</code>.
          </p>
        </div>
      )}
    </form>
  )
}
