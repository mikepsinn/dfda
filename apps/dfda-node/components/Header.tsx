"use client"

import Link from "next/link"
import Image from "next/image"
import type { User } from '@supabase/supabase-js'

// Import navigation logic and types
import {
  type NavItem,
  getLoggedInPrimaryNavItems,
  loggedOutPrimaryNavItems,
  secondaryNavItems,
  getAllMobileNavItems,
} from "@/lib/navigation"

// Import sub-components
import { DesktopNav } from "./layout/DesktopNav"
import { MobileNav } from "./layout/MobileNav"
import { UserAuthSection } from "./layout/UserAuthSection"

interface HeaderProps {
  initialUser: User | null
}

export function Header({ initialUser }: HeaderProps) {
  // Determine primary navigation based on user status
  const primaryNavItems: NavItem[] = initialUser
    ? getLoggedInPrimaryNavItems(initialUser)
    : loggedOutPrimaryNavItems

  // Get all items for mobile navigation
  const mobileNavItems: NavItem[] = getAllMobileNavItems(initialUser)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container px-4 md:px-6 mx-auto flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/images/dfda-logo.png"
              alt="dFDA Logo"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="text-xl font-bold">FDA.gov v2</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <DesktopNav
          user={initialUser}
          primaryNavItems={primaryNavItems}
          secondaryNavItems={secondaryNavItems}
        />

        <div className="flex items-center gap-4">
          {/* Mobile Menu Button & Sheet (handled by MobileNav) */}
          <MobileNav navItems={mobileNavItems} />

          {/* User Auth Section (Dropdown or Sign In/Register) */}
          <UserAuthSection user={initialUser} />
        </div>
      </div>
    </header>
  )
}
