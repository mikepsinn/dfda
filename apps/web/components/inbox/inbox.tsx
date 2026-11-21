'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, ListChecks, Star, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import {
  deleteFavoriteRecordAction, recordFavoriteAction, setFavoriteAction, skipNotificationsAction,
  snoozeNotificationsAction, trackNotificationsAction, undoNotificationsAction,
} from '@/lib/actions/inbox'
import type { Inbox as InboxData, InboxItem, InboxVariable } from '@/lib/inbox/load'
import { groupByDay } from '@/lib/inbox/view'
import { InboxCard, VariableIcon, type CardActions } from './inbox-card'
import { describeValue, ValueInput } from './value-input'

/** How long an answer's toast offers Undo. */
const UNDO_MS = 10_000

/**
 * The patient inbox, modeled on QuantiModo's reminder inbox (docs/MIGRATION.md,
 * "Patient app modeled on QuantiModo"): due reminders under day dividers, newest
 * first; each answer leaves the list at once and offers Undo, which works after
 * the answer is saved; and when nothing is due, "All caught up" with the
 * person's favorites.
 */
export function Inbox({ inbox }: { inbox: InboxData }) {
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState(inbox.items)
  const [pending, startTransition] = useTransition()
  useEffect(() => setItems(inbox.items), [inbox.items])

  const groups = useMemo(() => groupByDay(items, inbox.timezone), [items, inbox.timezone])
  const byVariable = useMemo(() => {
    const map = new Map<string, InboxItem[]>()
    for (const item of items) map.set(item.userVariableId, [...(map.get(item.userVariableId) ?? []), item])
    return map
  }, [items])

  /** Offers Undo, which puts the answered cards back at once and then saves. */
  function undoToast(title: string, answered: InboxItem[]) {
    const ids = answered.map((item) => item.notificationId)
    toast({
      title,
      duration: UNDO_MS,
      action: (
        <ToastAction altText="Undo" onClick={() => {
          setItems((current) => [...current, ...answered.filter((a) => !current.some((c) => c.notificationId === a.notificationId))]
            .sort((a, b) => b.dueAt.localeCompare(a.dueAt)))
          startTransition(async () => {
            const result = await undoNotificationsAction(ids)
            if (!result.ok) {
              setItems((current) => current.filter((item) => !ids.includes(item.notificationId)))
              toast({ title: 'Could not undo', description: result.error, variant: 'destructive' })
            }
            router.refresh()
          })
        }}>
          Undo
        </ToastAction>
      ),
    })
  }

  /** Removes the items at once, saves, and restores them if saving fails. */
  function answer(answered: InboxItem[], save: () => Promise<{ ok: true; notificationIds: string[] } | { ok: false; error: string }>, title: string) {
    const ids = new Set(answered.map((item) => item.notificationId))
    const before = items
    setItems((current) => current.filter((item) => !ids.has(item.notificationId)))
    startTransition(async () => {
      const result = await save()
      if (result.ok) undoToast(title, answered.filter((item) => result.notificationIds.includes(item.notificationId)))
      else {
        setItems(before)
        toast({ title: 'Not saved', description: result.error, variant: 'destructive' })
      }
    })
  }

  const actions: CardActions = {
    track: (answered, value) => answer(
      answered,
      () => trackNotificationsAction(answered.map((item) => item.notificationId), value),
      answered.length > 1
        ? `Recorded ${describeValue(answered[0], value)} for ${answered.length} ${answered[0].name} reminders`
        : `Recorded ${describeValue(answered[0], value)} for ${answered[0].name}`,
    ),
    skip: (answered) => answer(
      answered,
      () => skipNotificationsAction(answered.map((item) => item.notificationId)),
      answered.length > 1 ? `Skipped ${answered.length} ${answered[0].name} reminders` : `Skipped ${answered[0].name}`,
    ),
    snooze: (answered) => answer(
      answered,
      () => snoozeNotificationsAction(answered.map((item) => item.notificationId)),
      `Snoozed ${answered[0].name} for 1 hour`,
    ),
    toggleFavorite: (item) => startTransition(async () => {
      const result = await setFavoriteAction(item.userVariableId, !item.isFavorite)
      if (!result.ok) toast({ title: 'Not saved', description: result.error, variant: 'destructive' })
      else toast({ title: item.isFavorite ? `Removed ${item.name} from favorites` : `Added ${item.name} to favorites` })
      router.refresh()
    }),
  }

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground" aria-live="polite">
          {items.length === 0 ? 'Nothing is due.' : `${items.length} ${items.length === 1 ? 'reminder' : 'reminders'} to answer`}
        </p>
      </header>

      {items.length === 0 ? (
        <AllCaughtUp />
      ) : (
        groups.map(({ group, items: groupItems }) => (
          <section key={group} aria-labelledby={`inbox-${group}`} className="space-y-3">
            <h2 id={`inbox-${group}`} className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{group}</h2>
            <ul className="space-y-3">
              {groupItems.map((item) => (
                <li key={item.notificationId}>
                  <InboxCard
                    item={item}
                    sameVariable={byVariable.get(item.userVariableId) ?? [item]}
                    zone={inbox.timezone}
                    recent={group === 'Today' || group === 'Yesterday'}
                    disabled={pending}
                    actions={actions}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <Favorites favorites={inbox.favorites} />
    </div>
  )
}

function AllCaughtUp() {
  return (
    <Card className="flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center">
      <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Sun className="h-6 w-6 text-primary" />
      </span>
      <div className="flex-1 space-y-1">
        <h2 className="text-xl font-semibold">All caught up!</h2>
        <p className="text-sm text-muted-foreground">New reminders appear here when they are due.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/patient/reminders"><Bell aria-hidden="true" className="h-4 w-4" />Reminders</Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/patient/user-variables"><ListChecks aria-hidden="true" className="h-4 w-4" />My variables</Link>
        </Button>
      </div>
    </Card>
  )
}

/** Variables recorded as needed, in one tap, as in QuantiModo's Favorites. */
function Favorites({ favorites }: { favorites: InboxVariable[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [pending, startTransition] = useTransition()

  function record(variable: InboxVariable, value: number) {
    startTransition(async () => {
      const result = await recordFavoriteAction(variable.globalVariableId, value)
      if (!result.ok) {
        toast({ title: 'Not saved', description: result.error, variant: 'destructive' })
        return
      }
      toast({
        title: `Recorded ${describeValue(variable, value)} for ${variable.name}`,
        duration: UNDO_MS,
        action: (
          <ToastAction altText="Undo" onClick={() => startTransition(async () => {
            const undone = await deleteFavoriteRecordAction(result.measurementId)
            if (!undone.ok) toast({ title: 'Could not undo', description: undone.error, variant: 'destructive' })
            router.refresh()
          })}>
            Undo
          </ToastAction>
        ),
      })
      router.refresh()
    })
  }

  function unfavorite(variable: InboxVariable) {
    startTransition(async () => {
      const result = await setFavoriteAction(variable.userVariableId, false)
      if (!result.ok) toast({ title: 'Not saved', description: result.error, variant: 'destructive' })
      else toast({ title: `Removed ${variable.name} from favorites` })
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="inbox-favorites" className="space-y-3">
      <h2 id="inbox-favorites" className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Favorites</h2>
      {favorites.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star aria-hidden="true" className="h-4 w-4 shrink-0" />
          Add a variable to favorites from a reminder&rsquo;s menu to record it here any time.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {favorites.map((variable) => (
            <li key={variable.userVariableId}>
              <Card className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <VariableIcon emoji={variable.emoji} imageUrl={variable.imageUrl} />
                  <h3 className="min-w-0 flex-1 break-words font-semibold">{variable.name}</h3>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" disabled={pending}
                    aria-label={`Remove ${variable.name} from favorites`} onClick={() => unfavorite(variable)}>
                    <Star aria-hidden="true" className="h-4 w-4 fill-primary text-primary" />
                  </Button>
                </div>
                <ValueInput variable={variable} disabled={pending} idPrefix={`favorite-${variable.userVariableId}`}
                  onRecord={(value) => record(variable, value)} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
