"use client"

import { useActionState, useMemo, useRef, useState } from "react"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ProgramFormState } from "@/lib/actions/programs"
import { slugFromName } from "@/lib/instance/config"
import {
  BETTER_LABELS,
  KIND_LABELS,
  type Better,
  type Frequency,
  type ItemKind,
  type ProgramItemInput,
  type ProgramTemplate,
  type VariableOption,
} from "@/lib/programs/config"

type Row = { key: number; kind: ItemKind; name: string; frequency: Frequency; better: Better; defaultValue: string }
type Values = { name: string; slug: string; summary: string; followUpWeeks: string; rows: Row[] }

const selectClass =
  "h-10 rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"

type Initial = Pick<ProgramTemplate, "name" | "slug" | "summary" | "followUpWeeks" | "items">

function toValues(template: Initial, variables: VariableOption[], nextKey: () => number): Values {
  const byId = new Map(variables.map((variable) => [variable.id, variable]))
  return {
    name: template.name,
    slug: template.slug,
    summary: template.summary,
    followUpWeeks: String(template.followUpWeeks),
    rows: template.items.map((item) => ({
      key: nextKey(),
      kind: item.kind,
      name: byId.get(item.variableId)?.name ?? "",
      frequency: item.kind === "lab" ? "daily" : item.frequency,
      better: item.kind === "dose" ? "lower" : item.better,
      defaultValue: item.kind === "dose" && item.defaultValue !== null ? String(item.defaultValue) : "",
    })),
  }
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-sm text-destructive">{message}</p> : null
}

/**
 * The form for a program: what people track (doses, check-ins, labs) and
 * when they measure again. When creating, a template fills it in.
 */
export function ProgramForm({
  action,
  initial,
  templates,
  variables,
  submitLabel,
  addressPrefix,
}: {
  action: (state: ProgramFormState, formData: FormData) => Promise<ProgramFormState>
  initial: Initial
  /** Offered only when creating a program. */
  templates?: ProgramTemplate[]
  variables: VariableOption[]
  submitLabel: string
  addressPrefix: string
}) {
  const [state, formAction, pending] = useActionState(action, {})
  // Row keys: the same on the server and in the browser, then counting up.
  const keyCounter = useRef(0)
  const nextKey = () => keyCounter.current++
  const [values, setValues] = useState(() => toValues(initial, variables, nextKey))
  const [slugEdited, setSlugEdited] = useState(Boolean(initial.slug))
  const byName = useMemo(() => {
    const map = new Map<string, VariableOption>()
    for (const variable of variables) if (!map.has(variable.name.toLowerCase())) map.set(variable.name.toLowerCase(), variable)
    return map
  }, [variables])
  const variableFor = (name: string) => byName.get(name.trim().toLowerCase())

  const items: ProgramItemInput[] = values.rows.map((row) => {
    const variableId = variableFor(row.name)?.id ?? ""
    if (row.kind === "dose") {
      const amount = Number(row.defaultValue)
      return { kind: "dose", variableId, frequency: row.frequency, defaultValue: row.defaultValue && amount > 0 ? amount : null }
    }
    if (row.kind === "check_in") return { kind: "check_in", variableId, frequency: row.frequency, better: row.better }
    return { kind: "lab", variableId, better: row.better }
  })

  const setRow = (key: number, change: Partial<Row>) =>
    setValues((current) => ({ ...current, rows: current.rows.map((row) => (row.key === key ? { ...row, ...change } : row)) }))
  const addRow = (kind: ItemKind) =>
    setValues((current) => ({
      ...current,
      rows: [...current.rows, { key: nextKey(), kind, name: "", frequency: kind === "dose" ? "weekly" : "daily", better: "lower", defaultValue: "" }],
    }))
  const removeRow = (key: number) => setValues((current) => ({ ...current, rows: current.rows.filter((row) => row.key !== key) }))
  const errors = state.fieldErrors ?? {}

  return (
    <form action={formAction} className="max-w-4xl space-y-6">
      {state.error && (
        <p role="alert" className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm">
          {state.error}
        </p>
      )}

      {templates && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Start from</legend>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <Button
                key={template.key}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setValues(toValues(template, variables, nextKey))
                  setSlugEdited(Boolean(template.slug))
                }}
              >
                {template.label}
              </Button>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Program name</Label>
          <Input
            id="name"
            name="name"
            value={values.name}
            onChange={(event) => {
              const name = event.target.value
              setValues((current) => ({ ...current, name, ...(slugEdited ? {} : { slug: slugFromName(name) }) }))
            }}
            placeholder="GLP-1 weight program"
            required
          />
          <FieldError message={errors.name} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Address</Label>
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-sm text-muted-foreground">{addressPrefix}</span>
            <Input
              id="slug"
              name="slug"
              value={values.slug}
              onChange={(event) => {
                setSlugEdited(true)
                setValues((current) => ({ ...current, slug: event.target.value }))
              }}
              placeholder="glp-1"
              required
            />
          </div>
          <FieldError message={errors.slug} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          name="summary"
          rows={2}
          value={values.summary}
          onChange={(event) => setValues((current) => ({ ...current, summary: event.target.value }))}
          placeholder="Track your dose, weight and side effects. Enter blood markers before you start and at week 12."
        />
        <FieldError message={errors.summary} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="followUpWeeks">Follow-up after (weeks)</Label>
        <Input
          id="followUpWeeks"
          name="followUpWeeks"
          type="number"
          min={2}
          max={52}
          className="w-28"
          value={values.followUpWeeks}
          onChange={(event) => setValues((current) => ({ ...current, followUpWeeks: event.target.value }))}
          required
        />
        <FieldError message={errors.followUpWeeks} />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">What people track</legend>
        <p className="text-sm text-muted-foreground">
          Doses and check-ins become reminders when a person joins. Labs are entered at the start and at the follow-up.
          The report compares check-ins and labs.
        </p>
        <datalist id="program-variables">
          {variables.map((variable) => (
            <option key={variable.id} value={variable.name}>
              {variable.unit} · {variable.category}
            </option>
          ))}
        </datalist>
        <ul className="divide-y rounded-xl border">
          {values.rows.map((row, index) => {
            const variable = variableFor(row.name)
            const label = `${KIND_LABELS[row.kind]} ${index + 1}`
            return (
              <li key={row.key} className="grid gap-3 p-4 sm:grid-cols-[6rem_minmax(0,1fr)_auto_auto_auto] sm:items-start">
                <span className="pt-2 text-sm font-medium">{KIND_LABELS[row.kind]}</span>
                <div className="space-y-1">
                  <Input
                    aria-label={`${label}: variable`}
                    list="program-variables"
                    value={row.name}
                    onChange={(event) => setRow(row.key, { name: event.target.value })}
                    placeholder="Search variables"
                  />
                  <p className={variable || !row.name ? "text-xs text-muted-foreground" : "text-xs text-destructive"}>
                    {variable ? `Unit: ${variable.unit}` : row.name ? "Choose a variable from the list." : "\u00a0"}
                  </p>
                </div>
                {row.kind !== "lab" ? (
                  <select
                    aria-label={`${label}: how often`}
                    className={selectClass}
                    value={row.frequency}
                    onChange={(event) => setRow(row.key, { frequency: event.target.value as Frequency })}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                ) : (
                  <span className="hidden sm:block" />
                )}
                {row.kind === "dose" ? (
                  <Input
                    aria-label={`${label}: usual amount${variable ? ` (${variable.unit})` : ""}`}
                    type="number"
                    step="any"
                    min={0}
                    className="w-32"
                    value={row.defaultValue}
                    onChange={(event) => setRow(row.key, { defaultValue: event.target.value })}
                    placeholder={variable ? `Usual ${variable.unit}` : "Usual amount"}
                  />
                ) : (
                  <select
                    aria-label={`${label}: which way is better`}
                    className={selectClass}
                    value={row.better}
                    onChange={(event) => setRow(row.key, { better: event.target.value as Better })}
                  >
                    {Object.entries(BETTER_LABELS).map(([value, text]) => (
                      <option key={value} value={value}>
                        {text}
                      </option>
                    ))}
                  </select>
                )}
                <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label}`} onClick={() => removeRow(row.key)}>
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </Button>
              </li>
            )
          })}
          {values.rows.length === 0 && <li className="p-4 text-sm text-muted-foreground">Nothing to track yet.</li>}
        </ul>
        <div className="flex flex-wrap gap-2">
          {(["dose", "check_in", "lab"] as const).map((kind) => (
            <Button key={kind} type="button" variant="outline" size="sm" className="gap-1" onClick={() => addRow(kind)}>
              <Plus aria-hidden="true" className="h-4 w-4" />
              Add {KIND_LABELS[kind].toLowerCase()}
            </Button>
          ))}
        </div>
        <FieldError message={errors.items} />
      </fieldset>

      <input type="hidden" name="items" value={JSON.stringify(items)} />
      <Button type="submit" size="lg" disabled={pending} className="gap-2">
        {pending && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}
