'use client'

import Link from 'next/link'
import { DateTime } from 'luxon'
import { Bell, Clock, History, MoreHorizontal, Settings2, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { InboxItem } from '@/lib/inbox/load'
import { formatValue, ValueInput } from './value-input'

export type CardActions = {
  track: (items: InboxItem[], value: number) => void
  skip: (items: InboxItem[]) => void
  snooze: (items: InboxItem[]) => void
  toggleFavorite: (item: InboxItem) => void
}

function dueLabel(dueAt: string, zone: string, recent: boolean) {
  const time = DateTime.fromISO(dueAt).setZone(zone)
  return recent ? time.toFormat('h:mm a') : time.toFormat('ccc, LLL d, h:mm a')
}

export function VariableIcon({ emoji, imageUrl }: { emoji: string | null; imageUrl: string | null }) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
  }
  return (
    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xl">
      {emoji ?? <Bell className="h-5 w-5 text-primary" />}
    </span>
  )
}

/**
 * One due reminder, as on QuantiModo's inbox: the value to record, Skip,
 * Snooze and the reminder's settings, and a menu that answers all of the
 * variable's due reminders at once.
 */
export function InboxCard({ item, sameVariable, zone, recent, disabled, actions }: {
  item: InboxItem
  /** This variable's due reminders, this one included. */
  sameVariable: InboxItem[]
  zone: string
  /** True under Today or Yesterday, where the time alone is enough. */
  recent: boolean
  disabled: boolean
  actions: CardActions
}) {
  const others = sameVariable.length
  const unit = item.unit.abbreviatedName
  return (
    <Card className="space-y-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <VariableIcon emoji={item.emoji} imageUrl={item.imageUrl} />
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-semibold leading-snug">{item.title}</h3>
          <p className="text-sm text-muted-foreground">
            {dueLabel(item.dueAt, zone, recent)}
            {others > 1 && <span> · {others} due</span>}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" aria-label={`More for ${item.name}`} disabled={disabled}>
              <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            {others > 1 && (
              <>
                {item.presets.map((preset) => (
                  <DropdownMenuItem key={preset} onSelect={() => actions.track(sameVariable, preset)}>
                    Record {formatValue(preset, unit)} for all {others}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem onSelect={() => actions.skip(sameVariable)}>Skip all {others}</DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href={`/patient/history?variableId=${encodeURIComponent(item.globalVariableId)}`}><History aria-hidden="true" className="mr-2 h-4 w-4" />History</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => actions.toggleFavorite(item)}>
              <Star aria-hidden="true" className="mr-2 h-4 w-4" />
              {item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ValueInput variable={item} disabled={disabled} idPrefix={item.notificationId} onRecord={(value) => actions.track([item], value)} />

      <div className="flex flex-wrap gap-2 border-t pt-3">
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => actions.skip([item])} className="gap-1.5">
          <X aria-hidden="true" className="h-4 w-4" /> Skip
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => actions.snooze([item])} className="gap-1.5">
          <Clock aria-hidden="true" className="h-4 w-4" /> Snooze 1 hour
        </Button>
        <Button asChild variant="ghost" size="sm" className="ml-auto gap-1.5">
          <Link href={`/patient/reminders/${item.userVariableId}`}>
            <Settings2 aria-hidden="true" className="h-4 w-4" /> Edit reminder
          </Link>
        </Button>
      </div>
    </Card>
  )
}
