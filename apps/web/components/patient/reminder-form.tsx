'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, Plus, Trash2, X } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { deleteRemindersAction, saveReminderSettingsAction } from '@/lib/actions/patient-reminders'
import {
  clockTime, FREQUENCIES, MAX_TIMES, scheduleTimes, takesTimes, type FrequencyId,
} from '@/lib/patient/reminder-settings'
import type { ReminderVariable } from '@/lib/patient/reminders'

/** The first time of a new reminder. */
const DEFAULT_TIME = '08:00'

/** An added time: six hours after the last one, so that 8:00 AM is followed by 2:00 PM and 8:00 PM. */
function laterTime(time: string): string {
  const hours = (Number(time.slice(0, 2)) + 6) % 24
  return `${String(hours).padStart(2, '0')}:${time.slice(3, 5)}`
}

/** A saved instant as a local date (YYYY-MM-DD) in `zone`, for a date field. */
function localDate(iso: string | null, zone: string): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-CA', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso))
}

/**
 * QuantiModo's reminder form: the frequency, the times of day (up to three,
 * or the first of a reminder every few hours), the default value, whether the
 * inbox shows the reminders, and under "More options" the start and end
 * dates. As-needed makes the variable a favorite without a schedule.
 */
export function ReminderForm({ variable, returnTo }: { variable: ReminderVariable; returnTo: string }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()
  const saved = variable.settings
  const [frequency, setFrequency] = useState<FrequencyId | 'custom'>(saved?.frequency ?? 'daily')
  const [times, setTimes] = useState<string[]>(saved?.times.length ? saved.times : [DEFAULT_TIME])
  const [defaultValue, setDefaultValue] = useState(saved?.defaultValue === null || saved?.defaultValue === undefined ? '' : String(saved.defaultValue))
  const [isActive, setIsActive] = useState(saved?.isActive ?? true)
  const [startDate, setStartDate] = useState(localDate(saved?.startDate ?? null, variable.timezone))
  const [endDate, setEndDate] = useState(localDate(saved?.endDate ?? null, variable.timezone))
  const [error, setError] = useState<string | null>(null)
  const hasSchedule = Boolean(saved && saved.frequency !== 'as-needed')

  const asNeeded = frequency === 'as-needed'
  const custom = frequency === 'custom'
  const severalTimes = !custom && !asNeeded && takesTimes(frequency)
  const parsedDefault = Number.parseFloat(defaultValue)
  const defaultValid = defaultValue.trim() === '' || Number.isFinite(parsedDefault)
  const expanded = !custom && !asNeeded && !severalTimes ? scheduleTimes(frequency, times) : []

  function changeFrequency(next: string) {
    const id = next as FrequencyId | 'custom'
    setFrequency(id)
    // A reminder every few hours has one start time.
    if (id !== 'custom' && id !== 'as-needed' && !takesTimes(id)) setTimes((current) => current.slice(0, 1))
  }

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await saveReminderSettingsAction({
        globalVariableId: variable.globalVariableId,
        frequency,
        times: asNeeded ? [] : times,
        defaultValue: defaultValue.trim() === '' ? null : parsedDefault,
        isActive,
        startDate: startDate || null,
        endDate: endDate || null,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({ title: `Saved the reminder for ${variable.name}` })
      router.push(returnTo)
    })
  }

  function remove() {
    if (!variable.userVariableId) return
    const userVariableId = variable.userVariableId
    setError(null)
    startTransition(async () => {
      const result = await deleteRemindersAction(userVariableId)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast({ title: `Deleted the reminder for ${variable.name}` })
      router.push(returnTo)
    })
  }

  return (
    <Card className="p-4 sm:p-6">
      <form className="space-y-6" onSubmit={(event) => { event.preventDefault(); if (defaultValid) save() }}>
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl">
            {variable.emoji ?? variable.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-xl font-semibold">{variable.name}</h2>
            <p className="text-sm text-muted-foreground">{variable.category}</p>
          </div>
        </div>

        <div className="max-w-xs space-y-2">
          <Label htmlFor="reminder-frequency">Frequency</Label>
          <Select value={frequency} onValueChange={changeFrequency}>
            <SelectTrigger id="reminder-frequency" className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((option) => <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>)}
              {saved?.frequency === 'custom' && <SelectItem value="custom">Custom schedule</SelectItem>}
            </SelectContent>
          </Select>
          {asNeeded && (
            <p className="text-sm text-muted-foreground">No reminders. {variable.name} is one of your favorites, which you can record with one tap.</p>
          )}
          {custom && (
            <p className="text-sm text-muted-foreground">This schedule was set up elsewhere. You can change its times, or choose a frequency to replace it.</p>
          )}
        </div>

        {!asNeeded && (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">{severalTimes || custom ? 'Reminder times' : 'First reminder'}</legend>
            <ul className="space-y-2">
              {(severalTimes || custom ? times : times.slice(0, 1)).map((time, index) => (
                <li key={index} className="flex items-center gap-2">
                  <Label htmlFor={`reminder-time-${index}`} className="sr-only">{`Reminder time ${index + 1}`}</Label>
                  <Input id={`reminder-time-${index}`} type="time" required value={time} className="h-11 max-w-40"
                    onChange={(event) => setTimes((current) => current.map((t, i) => (i === index ? event.target.value : t)))} />
                  {severalTimes && index > 0 && (
                    <Button type="button" variant="ghost" size="icon" className="h-11 w-11" aria-label={`Remove reminder time ${index + 1}`}
                      onClick={() => setTimes((current) => current.filter((_, i) => i !== index))}>
                      <X aria-hidden="true" className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            {severalTimes && times.length < MAX_TIMES && (
              <Button type="button" variant="outline" size="sm" className="h-9 gap-1.5"
                onClick={() => setTimes((current) => [...current, laterTime(current[current.length - 1] ?? DEFAULT_TIME)])}>
                <Plus aria-hidden="true" className="h-4 w-4" />Add a time
              </Button>
            )}
            {expanded.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {expanded.length <= 8
                  ? `Reminders at ${expanded.map(clockTime).join(', ')}.`
                  : `${expanded.length} reminders a day, from ${clockTime(expanded[0])}.`}
              </p>
            )}
          </fieldset>
        )}

        {!asNeeded && (
          <div className="max-w-xs space-y-2">
            <Label htmlFor="reminder-default">Default value</Label>
            <div className="flex items-center gap-2">
              <Input id="reminder-default" type="number" inputMode="decimal" step="any" value={defaultValue} className="h-11 max-w-40"
                onChange={(event) => setDefaultValue(event.target.value)} placeholder="Typical value" aria-describedby="reminder-default-help" />
              <span className="text-sm text-muted-foreground">{variable.unit}</span>
            </div>
            <p id="reminder-default-help" className="text-sm text-muted-foreground">The inbox offers it first. Leave it empty to choose each time.</p>
            {!defaultValid && <p className="text-sm text-destructive">Enter a number, or leave it empty.</p>}
          </div>
        )}

        {!asNeeded && hasSchedule && (
          <div className="flex items-center gap-3">
            <Switch id="reminder-active" checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor="reminder-active">{isActive ? 'Inbox notifications on' : 'Inbox notifications paused'}</Label>
          </div>
        )}

        {!asNeeded && (
          <Collapsible defaultOpen={Boolean(endDate)}>
            <CollapsibleTrigger asChild>
              <Button type="button" variant="ghost" size="sm" className="group -ml-3 h-9 gap-1.5">
                More options<ChevronDown aria-hidden="true" className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="grid max-w-md grid-cols-2 gap-3 pt-2">
              <div className="space-y-2">
                <Label htmlFor="reminder-start">Start date</Label>
                <Input id="reminder-start" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminder-end">End date</Label>
                <Input id="reminder-end" type="date" value={endDate} min={startDate || undefined}
                  onChange={(event) => setEndDate(event.target.value)} className="h-11" />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={pending || !defaultValid} className="h-11 min-w-28">Save</Button>
          <Button asChild type="button" variant="outline" className="h-11"><Link href={returnTo}>Cancel</Link></Button>
          {saved && variable.userVariableId && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="ghost" disabled={pending} className="h-11 gap-1.5 text-destructive hover:text-destructive sm:ml-auto">
                  <Trash2 aria-hidden="true" className="h-4 w-4" />Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete the reminder for {variable.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Its reminders stop and it is no longer a favorite. Your measurements of {variable.name} stay.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </form>
    </Card>
  )
}
