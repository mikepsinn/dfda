"use client"

import Link from "next/link"
import Image from "next/image"
import type { User } from '@supabase/supabase-js'
import { useEffect } from 'react';
import type { Profile } from "@/app/actions/profiles";
import { updateUserProfileTimezoneAction } from "@/app/actions/profiles";
import { logger } from "@/lib/logger";
import { type NavItem } from "@/lib/types/navigation";

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

  // Determine primary navigation based on user status
  const primaryNavItems: NavItem[] = initialUser
    ? getLoggedInPrimaryNavItems(initialUser)
    : loggedOutPrimaryNavItems

  // Get all items for mobile navigation
  const mobileNavItems: NavItem[] = getAllMobileNavItems(initialUser)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      {/* Container with adjusted flex for mobile layout */}
      <div className="container px-4 md:px-6 mx-auto flex h-16 items-center justify-between">
        
        {/* Mobile Nav Button (now first on mobile) */}
        {/* Rendered via MobileNav, which handles the md:hidden internally */}
        <MobileNav navItems={mobileNavItems} />

        {/* Logo and Desktop Nav container */}
        {/* On mobile, only Logo is effectively visible. On desktop, it pushes auth section right */}
        <div className="flex flex-1 items-center gap-2 md:gap-6">
          {/* Logo - hidden on mobile if MobileNav button is there, shown otherwise */} 
          {/* We need the logo visible on mobile too, so remove hiding logic. Flex handles spacing. */}
          <Link href="/" className="flex items-center gap-2 mr-auto md:mr-0"> {/* mr-auto pushes logo left on mobile */} 
            <Image
              src="/images/dfda-logo.png"
              alt="dFDA Logo"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="text-xl font-bold">FDA.gov v2</span>
          </Link>

          {/* Desktop Navigation (hidden on mobile) */}
          {/* flex-1 on parent div and gap handles spacing */}
          <DesktopNav
            user={initialUser}
            primaryNavItems={primaryNavItems}
            secondaryNavItems={secondaryNavItems}
          />
        </div>

        {/* User Auth Section (remains on the far right) */}
        <UserAuthSection 
          user={initialUser} 
          primaryNavItems={primaryNavItems} 
          secondaryNavItems={secondaryNavItems}
        />
      </div>
    </header>
  )
}
