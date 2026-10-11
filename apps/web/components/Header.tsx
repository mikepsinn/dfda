"use client"

import Link from "next/link"
import { SiteLogo } from "./instance/SiteLogo"
import type { AuthUser as User } from '@/lib/auth'
import { useEffect, useState } from 'react';
import type { Profile } from "@/lib/actions/profiles";
import { type NavItem } from "@/lib/types/navigation";
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { Button } from "@/components/ui/button"
import { SearchModal } from "./SearchModal"

// Import navigation logic and types
import {
  getLoggedInPrimaryNavItems,
  loggedOutPrimaryNavItems,
  secondaryNavItems,
  getAllMobileNavItems,
} from "@/lib/navigation"

// Import sub-components
import { DesktopNav } from "./layout/DesktopNav"
import { MobileNav } from "./layout/MobileNav"
import { UserAuthSection } from "./layout/UserAuthSection"
import { useProfileTimezone } from "./layout/use-profile-timezone"

interface HeaderProps {
  initialUser: User | null;
  initialProfile: Profile | null;
  siteName: string;
}

/** The network's header. A company instance has its own (instance/InstanceHeader). */
export function Header({ initialUser, initialProfile, siteName }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useProfileTimezone(initialUser, initialProfile);

  // Add keybinding for search (e.g., Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsSearchOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Determine primary navigation based on user status and profile
  const primaryNavItems: NavItem[] = initialUser
    ? getLoggedInPrimaryNavItems(initialProfile?.user_type ?? null)
    : loggedOutPrimaryNavItems

  // Get all items for mobile navigation based on profile type
  const mobileNavItems: NavItem[] = getAllMobileNavItems(initialProfile?.user_type ?? null)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      {/* Container with adjusted flex for mobile layout */}
      <div className="container px-4 md:px-6 mx-auto flex h-16 items-center justify-between">
        
        {/* Mobile Nav Button (now first on mobile) */}
        {/* Rendered via MobileNav, which handles the lg:hidden internally */}
        <MobileNav navItems={mobileNavItems} siteName={siteName} />

        {/* Logo and Desktop Nav container */}
        <div className="flex flex-1 items-center lg:gap-6">
          {/* Logo - always visible */}
          <Link href="/" className="flex items-center gap-2">
            <SiteLogo className="hidden h-8 w-8 flex-shrink-0 min-[370px]:flex" />
            {/* A long name wraps to a two-line wordmark below 2xl, so it does not crowd the links. */}
            <span className="max-w-[8.5rem] text-xs font-bold leading-tight min-[370px]:text-sm sm:max-w-[10rem] sm:text-base 2xl:max-w-none 2xl:text-xl">
              {siteName}
            </span>
          </Link>

          {/* Center the DesktopNav */}
          <div className="flex-1 flex justify-center">
            <DesktopNav
              user={initialUser}
              primaryNavItems={primaryNavItems}
              secondaryNavItems={secondaryNavItems}
            />
          </div>
        </div>

        {/* Search Button and User Auth Section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
            aria-label="Search treatments, conditions and more"
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </Button>
          <UserAuthSection 
            user={initialUser} 
            primaryNavItems={primaryNavItems} 
            secondaryNavItems={secondaryNavItems}
          />
        </div>
      </div>
      {/* Render Search Modal */}
      <SearchModal 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        user={initialUser} 
      />
    </header>
  )
}
