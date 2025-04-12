"use client"

import Link from "next/link"
import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { NavItem } from "@/lib/navigation"
import type { User } from "@supabase/supabase-js"

interface DesktopNavProps {
  user: User | null // Need user to determine logged-in state
  primaryNavItems: NavItem[]
  secondaryNavItems: NavItem[]
}

export function DesktopNav({
  user,
  primaryNavItems,
  secondaryNavItems,
}: DesktopNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  return (
    <nav className="hidden md:flex gap-6 items-center"> {/* Hide on mobile */}
      {/* Always show Primary Nav Items */}
      {primaryNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="text-sm font-medium hover:underline"
        >
          {item.title}
        </Link>
      ))}

      {/* Conditionally show "More" dropdown only when logged out */}
      {!user && (
        <DropdownMenu open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1 text-sm font-medium hover:underline">
              More{" "}
              {isMoreOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {secondaryNavItems.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link href={item.href}>{item.title}</Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </nav>
  )
} 