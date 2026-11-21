'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Trash2 } from 'lucide-react'
import { FACES } from '@/components/inbox/value-input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import {
  deleteMeasurementAction, recordMeasurementAction, restoreMeasurementAction, updateMeasurementAction,
} from '@/lib/actions/recording'
import type { EditableMeasurement, RecordingVariable } from '@/lib/patient/variables'
import { getRatingRange, getVariableInputType } from '@/lib/variable-helpers'

/** How long a deletion's toast offers Undo. */
const UNDO_MS = 10_000

/** A value in words for the button and the toast: "Yes", "4 of 5", or the number with its unit. */
export function valueText(value: number, unit: { id: string; abbreviatedName: string }) {
  const inputType = getVariableInputType({ unitId: unit.id, variableCategory: null })
  if (inputType === 'boolean_yes_no') return value ? 'Yes' : 'No'
  const range = getRatingRange(inputType)
  if (range) return `${value} of ${range[1]}`
  return unit.abbreviatedName ? `${value} ${unit.abbreviatedName}` : String(value)
}

function Choice({ selected, onClick, label, children, className }: {
  selected: boolean
  onClick: () => void
  label?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Button type="button" variant={selected ? 'default' : 'outline'} aria-pressed={selected} aria-label={label} onClick={onClick}
      className={className}>
      {children}
    </Button>
  )
}

/**
 * QuantiModo's measurement form: the value (faces for a rating, Yes and No,
 * or a number with recent values), the unit, the date and time in the
 * person's time zone, and a note. With a measurement it changes that value and
 * offers Delete.
 */
export function MeasurementForm({ variable, measurement, defaultDate, defaultTime, returnTo }: {
  variable: RecordingVariable
  measurement?: EditableMeasurement
  defaultDate: string
  defaultTime: string
  returnTo: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const initialValue = measurement?.value ?? variable.defaultValue
  const [text, setText] = useState(initialValue === null ? '' : String(initialValue))
  const [unitId, setUnitId] = useState(measurement?.unitId ?? variable.unitId)
  const [date, setDate] = useState(measurement?.date ?? defaultDate)
  const [time, setTime] = useState(measurement?.time ?? defaultTime)
  const [note, setNote] = useState(measurement?.note ?? '')
  const [error, setError] = useState<string | null>(null)

  const unit = variable.units.find((u) => u.id === unitId) ?? variable.units[0]
  const inputType = getVariableInputType({ unitId: unit.id, variableCategory: null })
  const range = getRatingRange(inputType)
  const parsed = Number.parseFloat(text)
  const value = text.trim() !== '' && Number.isFinite(parsed) ? parsed : null
  const outOfRange = value !== null && range !== null && (value < range[0] || value > range[1])
  const canSave = value !== null && !outOfRange && date !== '' && time !== '' && !pending

  function save() {
    if (value === null) return
    setError(null)
    startTransition(async () => {
      const fields = { value, unitId: unit.id, date, time, note }
      const result = measurement
        ? await updateMeasurementAction({ ...fields, measurementId: measurement.id })
        : await recordMeasurementAction({ ...fields, globalVariableId: variable.globalVariableId })
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({ title: `${measurement ? 'Saved' : 'Recorded'} ${valueText(value, unit)} for ${variable.name}` })
      router.push(returnTo)
    })
  }

  function remove() {
    if (!measurement) return
    setError(null)
    startTransition(async () => {
      const result = await deleteMeasurementAction(measurement.id)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({
        title: `Deleted ${valueText(measurement.value, variable.units.find((u) => u.id === measurement.unitId) ?? unit)} for ${variable.name}`,
        duration: UNDO_MS,
        action: (
          <ToastAction altText="Undo" onClick={async () => {
            const undone = await restoreMeasurementAction(measurement.id)
            if (!undone.ok) toast({ title: 'Could not undo', description: undone.error, variant: 'destructive' })
            router.refresh()
          }}>Undo</ToastAction>
        ),
      })
      router.push(returnTo)
    })
  }

  const presets = unit.id === variable.unitId ? variable.presets : []

  return (
    <Card className="p-4 sm:p-6">
      <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); if (canSave) save() }}>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl">
            {variable.emoji ?? variable.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold">{variable.name}</h2>
            <p className="text-sm text-muted-foreground">{variable.category}</p>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Value</legend>
          {inputType === 'boolean_yes_no' ? (
            <div className="grid max-w-xs grid-cols-2 gap-2">
              <Choice selected={value === 0} onClick={() => setText('0')}>No</Choice>
              <Choice selected={value === 1} onClick={() => setText('1')}>Yes</Choice>
            </div>
          ) : inputType === 'rating_1_5' ? (
            <div className="grid max-w-md grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Choice key={rating} selected={value === rating} onClick={() => setText(String(rating))} label={`${rating} of 5`}
                  className="h-auto flex-col gap-0.5 py-2">
                  <span aria-hidden="true" className="text-2xl leading-none">{FACES[variable.higherIsWorse ? 5 - rating : rating - 1]}</span>
                  <span aria-hidden="true" className="text-xs tabular-nums">{rating}</span>
                </Choice>
              ))}
            </div>
          ) : range ? (
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i).map((rating) => (
                <Choice key={rating} selected={value === rating} onClick={() => setText(String(rating))} label={`${rating} of ${range[1]}`}
                  className="h-10 w-10 p-0 tabular-nums">
                  {rating}
                </Choice>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {presets.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {presets.map((preset) => (
                    <Choice key={preset} selected={value === preset} onClick={() => setText(String(preset))} className="h-9 tabular-nums">
                      {valueText(preset, unit)}
                    </Choice>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Label htmlFor="measurement-value" className="sr-only">{`Value in ${unit.abbreviatedName || 'units'}`}</Label>
                <Input id="measurement-value" type="number" inputMode="decimal" step="any" value={text}
                  onChange={(event) => setText(event.target.value)} placeholder="Enter a value" className="h-11 max-w-48" />
                <span className="text-sm text-muted-foreground">{unit.abbreviatedName}</span>
              </div>
            </div>
          )}
          {outOfRange && range && <p className="text-sm text-destructive">Choose a value from {range[0]} to {range[1]}.</p>}
        </fieldset>

        {variable.units.length > 1 && (
          <div className="max-w-xs space-y-2">
            <Label htmlFor="measurement-unit">Unit</Label>
            <Select value={unit.id} onValueChange={setUnitId}>
              <SelectTrigger id="measurement-unit" className="h-11"><SelectValue /></SelectTrigger>
              <SelectContent>
                {variable.units.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.abbreviatedName ? `${u.name} (${u.abbreviatedName})` : u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid max-w-md grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="measurement-date">Date</Label>
            <Input id="measurement-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className="h-11" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="measurement-time">Time</Label>
            <Input id="measurement-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} className="h-11" required />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="measurement-note">Note</Label>
          <Input id="measurement-note" value={note} maxLength={2000} onChange={(event) => setNote(event.target.value)}
            placeholder="Optional" className="h-11" />
        </div>

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={!canSave} className="h-11 min-w-32">
            {measurement ? 'Save' : value === null ? 'Record' : `Record ${valueText(value, unit)}`}
          </Button>
          <Button asChild type="button" variant="outline" className="h-11">
            <Link href={returnTo}>Cancel</Link>
          </Button>
          {measurement ? (
            <Button type="button" variant="ghost" onClick={remove} disabled={pending}
              className="h-11 gap-1.5 text-destructive hover:text-destructive sm:ml-auto">
              <Trash2 aria-hidden="true" className="h-4 w-4" />Delete
            </Button>
          ) : (
            <Button asChild type="button" variant="ghost" className="h-11 gap-1.5 sm:ml-auto">
              <Link href={`/patient/reminders/new?variableId=${encodeURIComponent(variable.globalVariableId)}`}>
                <Bell aria-hidden="true" className="h-4 w-4" />Remind me to track
              </Link>
            </Button>
          )}
        </div>
      </form>
    </Card>
  )
}
