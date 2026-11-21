'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, PencilLine, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

/**
 * The "+" button of QuantiModo's patient app, on each of its pages: record a
 * measurement, or add a reminder. On wider screens it sits above the toasts
 * (bottom right), so an Undo toast never covers it.
 */
export function QuickAddButton() {
  // Onboarding is a guided flow, as for the menu (patient-nav.tsx).
  if (usePathname().startsWith('/patient/onboarding')) return null
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" aria-label="Add a measurement or reminder"
          className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full shadow-lg sm:bottom-28">
          <Plus aria-hidden="true" className="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-60">
        <DropdownMenuItem asChild>
          <Link href="/patient/measurements/new"><PencilLine aria-hidden="true" className="mr-2 h-4 w-4" />Record a measurement</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/patient/reminders/new"><Bell aria-hidden="true" className="mr-2 h-4 w-4" />Add a reminder</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
