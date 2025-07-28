"use client"

import Link from "next/link"
import Image from "next/image"
import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react';
import type { Profile } from "@/lib/actions/profiles";
import { updateUserProfileTimezoneAction } from "@/lib/actions/profiles";
import { logger } from "@/lib/logger";
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

interface HeaderProps {
  initialUser: User | null;
  initialProfile: Profile | null;
}

export function Header({ initialUser, initialProfile }: HeaderProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // UseEffect to check and update timezone if needed
  useEffect(() => {
    if (initialUser && initialProfile && !initialProfile.timezone) {
      try {
        const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (browserTimezone && typeof browserTimezone === 'string') {
          logger.info("Header: Profile timezone missing, attempting update", { userId: initialUser.id, browserTimezone });
          
          updateUserProfileTimezoneAction(browserTimezone)
            .then(result => {
              if (!result.success) {
                logger.warn("Header: Failed auto timezone update", { userId: initialUser.id, error: result.error });
              } else {
                 logger.info("Header: Auto timezone update successful", { userId: initialUser.id });
              }
            })
            .catch(err => {
               logger.error("Header: Error calling timezone update action", { userId: initialUser.id, error: err });
            });
        }
      } catch (e) {
         logger.error("Header: Error getting browser timezone", { error: e });
      }
    }
    // Run only when user/profile data potentially changes
  }, [initialUser, initialProfile]); 

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
        {/* Rendered via MobileNav, which handles the md:hidden internally */}
        <MobileNav navItems={mobileNavItems} />

        {/* Logo and Desktop Nav container */}
        <div className="flex flex-1 items-center">
          {/* Logo - always visible */}
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
            aria-label="Open search"
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
