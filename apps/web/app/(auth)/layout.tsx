import type React from "react"
import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { dashboardPathFor, getUserProfile } from "@/lib/profile"
import { logger } from "@/lib/logger" // Import logger

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()

  // If the user is already logged in, check their role and redirect
  if (user) {
    const profile = await getUserProfile(user) // Fetch profile
    
    // Check the profile table for user_type
    if (profile?.user_type) {
      const userType = profile.user_type;
      // User has a role, redirect to their specific dashboard
      logger.info('Auth layout: User has role from profile, redirecting', { userId: user.id, role: userType });
      redirect(dashboardPathFor(userType));
    } else {
      // User is logged in but has no role according to profile table, redirect to select role page
      logger.info('Auth layout: User has no role in profile, redirecting to select-role', { userId: user.id });
      redirect("/select-role");
    }
  }

  // If no user, render the login/register/forgot-password page
  return children
} 