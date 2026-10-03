import type { ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  MAX_SEARCH_TEXT_LENGTH,
  ageOptions,
  defaultTrialSearchForm,
  sexOptions,
  statusOptions,
  studyTypeOptions,
  type TrialSearchForm as TrialSearchFormValues,
} from "@/lib/trials/trial-search"
import { LocationField } from "./location-field"
import { RegistrySuggestInput } from "./registry-suggest-input"
import { SearchSubmitButton } from "./search-submit-button"

const selectClassName =
  "h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

// A GET form, so every search has a URL that can be shared and the form works without JavaScript.
// The action's #results takes the new page to the results instead of the top of the form.
export function TrialSearchForm({ form }: { form: TrialSearchFormValues }) {
  const moreFilters = form.status !== defaultTrialSearchForm.status || form.type !== "all" || form.sex !== "all" ||
    form.ages.length > 0
  const hasSearch = Boolean(form.condition || form.treatment || form.location || form.near) || moreFilters

  return (
    <form id="trial-search" action="/find-trials#results" method="get" role="search" aria-label="Search clinical trials"
      className="scroll-mt-24 space-y-5 rounded-xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field id="trial-condition" label="Condition">
          <RegistrySuggestInput dictionary="Condition" id="trial-condition" name="condition"
            defaultValue={form.condition} placeholder="For example, asthma" maxLength={MAX_SEARCH_TEXT_LENGTH} />
        </Field>
        <Field id="trial-treatment" label="Treatment">
          <RegistrySuggestInput dictionary="InterventionName" id="trial-treatment" name="treatment"
            defaultValue={form.treatment} placeholder="For example, montelukast" maxLength={MAX_SEARCH_TEXT_LENGTH} />
        </Field>
        <LocationField defaultLocation={form.location} defaultNear={form.near} defaultDistance={form.distance}
          maxLength={MAX_SEARCH_TEXT_LENGTH} />
      </div>

      <details open={moreFilters} className="rounded-lg border bg-muted/30 p-4">
        <summary className="cursor-pointer text-sm font-medium">More filters: status, study type, sex and age</summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field id="trial-status" label="Study status">
            <select id="trial-status" name="status" defaultValue={form.status} className={selectClassName}>
              {statusOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field id="trial-type" label="Study type">
            <select id="trial-type" name="type" defaultValue={form.type} className={selectClassName}>
              {studyTypeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field id="trial-sex" label="Participant's sex" hint="Includes studies open to all sexes">
            <select id="trial-sex" name="sex" defaultValue={form.sex} className={selectClassName}>
              {sexOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Participant&apos;s age</legend>
            {ageOptions.map(option => (
              <label key={option.value} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="age" value={option.value} defaultChecked={form.ages.includes(option.value)}
                  className="h-4 w-4 accent-primary" />
                {option.label}
              </label>
            ))}
          </fieldset>
        </div>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        <SearchSubmitButton />
        {hasSearch && (
          <Button variant="ghost" asChild>
            <Link href="/find-trials">Clear search</Link>
          </Button>
        )}
      </div>
    </form>
  )
}

function Field({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <label htmlFor={id} className="block text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
