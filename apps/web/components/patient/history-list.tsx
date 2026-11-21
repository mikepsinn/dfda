'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, MoreVertical, PencilLine, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ToastAction } from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'
import { deleteMeasurementAction, loadHistoryPageAction, restoreMeasurementAction } from '@/lib/actions/recording'
import type { HistoryFilter, HistoryItem, HistoryPage } from '@/lib/patient/history'
import { valueText } from './measurement-form'

/** How long a deletion's toast offers Undo. */
const UNDO_MS = 10_000

function when(iso: string, zone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: zone, weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(iso))
}

/**
 * QuantiModo's History: each measurement with its value, variable, time and
 * note, newest first, with Edit and Delete (which offers Undo), and "Load
 * more" for the next page.
 */
export function HistoryList({ initial, filter, timezone, returnTo }: {
  initial: HistoryPage
  filter: HistoryFilter
  timezone: string
  returnTo: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [items, setItems] = useState(initial.items)
  const [cursor, setCursor] = useState(initial.nextCursor)
  const [pending, startTransition] = useTransition()
  useEffect(() => {
    setItems(initial.items)
    setCursor(initial.nextCursor)
  }, [initial])

  function loadMore() {
    if (!cursor) return
    startTransition(async () => {
      const result = await loadHistoryPageAction(filter, cursor)
      if (!result.ok) {
        toast({ title: 'Could not load more', description: result.error, variant: 'destructive' })
        return
      }
      setItems((current) => [...current, ...result.items.filter((item) => !current.some((c) => c.id === item.id))])
      setCursor(result.nextCursor)
    })
  }

  function remove(item: HistoryItem) {
    setItems((current) => current.filter((c) => c.id !== item.id))
    startTransition(async () => {
      const result = await deleteMeasurementAction(item.id)
      if (!result.ok) {
        setItems((current) => [...current, item].sort((a, b) => b.startAt.localeCompare(a.startAt)))
        toast({ title: 'Could not delete', description: result.error, variant: 'destructive' })
        return
      }
      toast({
        title: `Deleted ${valueText(item.value, item.unit)} for ${item.name}`,
        duration: UNDO_MS,
        action: (
          <ToastAction altText="Undo" onClick={() => {
            setItems((current) => [...current, item].sort((a, b) => b.startAt.localeCompare(a.startAt)))
            startTransition(async () => {
              const undone = await restoreMeasurementAction(item.id)
              if (!undone.ok) {
                setItems((current) => current.filter((c) => c.id !== item.id))
                toast({ title: 'Could not undo', description: undone.error, variant: 'destructive' })
              }
              router.refresh()
            })
          }}>Undo</ToastAction>
        ),
      })
    })
  }

  if (items.length === 0) {
    return (
      <Card className="space-y-4 p-6 text-center">
        <p className="text-muted-foreground">No measurements here yet. Add a reminder and start tracking.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline" className="gap-1.5"><Link href="/patient/reminders/new"><Bell aria-hidden="true" className="h-4 w-4" />Add a reminder</Link></Button>
          <Button asChild variant="outline" className="gap-1.5"><Link href="/patient/measurements/new"><PencilLine aria-hidden="true" className="h-4 w-4" />Record a measurement</Link></Button>
        </div>
      </Card>
    )
  }

  const back = encodeURIComponent(returnTo)
  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-lg border" aria-label="Measurements">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 px-4 py-3">
            <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg">
              {item.emoji ?? item.name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold">
                <span className="tabular-nums">{valueText(item.value, item.unit)}</span> {item.name}
              </p>
              <p className="text-sm text-muted-foreground">{when(item.startAt, timezone)}</p>
              {item.note && <p className="mt-1 break-words text-sm">{item.note}</p>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label={`Options for ${item.name} on ${when(item.startAt, timezone)}`}>
                  <MoreVertical aria-hidden="true" className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/patient/measurements/${item.id}?returnTo=${back}`}><PencilLine aria-hidden="true" className="mr-2 h-4 w-4" />Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/patient/measurements/new?variableId=${encodeURIComponent(item.globalVariableId)}&returnTo=${back}`}>
                    <PencilLine aria-hidden="true" className="mr-2 h-4 w-4" />Record another
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => remove(item)} className="text-destructive focus:text-destructive">
                  <Trash2 aria-hidden="true" className="mr-2 h-4 w-4" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        ))}
      </ul>
      {cursor && (
        <div className="text-center">
          <Button type="button" variant="outline" onClick={loadMore} disabled={pending}>{pending ? 'Loading…' : 'Load more'}</Button>
        </div>
      )}
    </div>
  )
}
