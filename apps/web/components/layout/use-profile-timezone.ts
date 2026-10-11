"use client"

import { useEffect } from "react"
import type { AuthUser as User } from "@/lib/auth"
import type { Profile } from "@/lib/actions/profiles"
import { updateUserProfileTimezoneAction } from "@/lib/actions/profiles"
import { logger } from "@/lib/logger"

/** Saves the browser's time zone in a signed-in user's profile when it has none. Reminders use it. */
export function useProfileTimezone(user: User | null, profile: Profile | null) {
  useEffect(() => {
    if (!user || !profile || profile.timezone) return
    try {
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (!browserTimezone) return
      logger.info("Header: Profile timezone missing, attempting update", { userId: user.id, browserTimezone })
      updateUserProfileTimezoneAction(browserTimezone)
        .then((result) => {
          if (!result.success) {
            logger.warn("Header: Failed auto timezone update", { userId: user.id, error: result.error })
          } else {
            logger.info("Header: Auto timezone update successful", { userId: user.id })
          }
        })
        .catch((err) => {
          logger.error("Header: Error calling timezone update action", { userId: user.id, error: err })
        })
    } catch (e) {
      logger.error("Header: Error getting browser timezone", { error: e })
    }
  }, [user, profile])
}
