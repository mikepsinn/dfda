'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FlaskConical, HeartPulse, History, Inbox, ListChecks, Pill, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

// The patient app's menu, modeled on QuantiModo's side menu (docs/MIGRATION.md,
// "Patient app modeled on QuantiModo"): the inbox first, then the person's
// variables (with their reminders) and history, then this app's own conditions,
// treatments and trials.
const items = [
  { href: '/patient', label: 'Inbox', icon: Inbox, exact: true },
  { href: '/patient/user-variables', label: 'My variables', icon: ListChecks },
  { href: '/patient/history', label: 'History', icon: History },
  { href: '/patient/conditions', label: 'Conditions', icon: HeartPulse },
  { href: '/patient/treatments', label: 'Treatments', icon: Pill },
  { href: '/find-trials', label: 'Find trials', icon: FlaskConical },
  { href: '/user/settings', label: 'Settings', icon: Settings },
] as const

export function PatientNav() {
  const pathname = usePathname()
  // Onboarding is a guided flow; the menu would lead away from it.
  if (pathname.startsWith('/patient/onboarding')) return null
  const isActive = (item: (typeof items)[number]) =>
    'exact' in item ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`)

  return (
    <nav aria-label="Patient" className="border-b bg-background lg:sticky lg:top-16 lg:w-56 lg:shrink-0 lg:self-start lg:border-b-0 lg:border-r lg:py-6">
      <ul className="flex gap-1 overflow-x-auto px-4 py-2 lg:flex-col lg:overflow-visible lg:px-3 lg:py-0">
        {items.map((item) => {
          const active = isActive(item)
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-10 items-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <item.icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
