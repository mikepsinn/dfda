"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

interface SettingsNavItem {
  title: string
  href: string
}

interface SettingsMobileNavProps {
  items: SettingsNavItem[]
}

export function SettingsMobileNav({ items }: SettingsMobileNavProps) {
  const pathname = usePathname()
  const [open, setOpen] = React.useState(false)
  const currentItem = items.find((item) => item.href === pathname)

  return (
    <div className="relative md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="group neobrutalist-button w-full flex items-center justify-between font-black text-base"
      >
        <span>{currentItem?.title || "Settings"}</span>
        <Icons.down className="h-4 w-4 transition-transform duration-200" 
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50">
          <div className="neobrutalist-container bg-white p-2 space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block px-4 py-2 text-sm font-black hover:bg-black hover:text-white transition-colors rounded-lg",
                  pathname === item.href ? "bg-black text-white" : "text-black"
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 