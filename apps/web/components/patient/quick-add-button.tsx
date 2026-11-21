'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { Bell, PencilLine, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

/**
 * The "+" button of QuantiModo's patient app: record a measurement, or add and
 * change reminders. On wider screens it sits above the toasts (bottom right),
 * so an Undo toast never covers it.
 */
export function QuickAddButton({ onRecord }: { onRecord: () => void }) {
  // The record dialog opens once the menu has closed: focus returning to this
  // button while the dialog opens would close the dialog at once.
  const recordAfterClose = useRef(false)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" aria-label="Add a measurement or reminder"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg sm:bottom-28">
          <Plus aria-hidden="true" className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-60" onCloseAutoFocus={(event) => {
        if (!recordAfterClose.current) return
        recordAfterClose.current = false
        event.preventDefault()
        onRecord()
      }}>
        <DropdownMenuItem onSelect={() => { recordAfterClose.current = true }}>
          <PencilLine aria-hidden="true" className="mr-2 h-4 w-4" />Record a measurement
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/patient/reminders"><Bell aria-hidden="true" className="mr-2 h-4 w-4" />Add or change reminders</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
