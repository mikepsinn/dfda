import type React from "react"
import { getServerUser } from "@/lib/server-auth"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server" // Import Supabase server client
import { logger } from "@/lib/logger" // Import logger

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getServerUser()

  // If the user is already logged in, check their role and redirect
  if (user) {
    const supabase = await createClient()
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single()

    if (profileError) {
      logger.error('Error fetching profile in auth layout:', { userId: user.id, error: profileError });
      // Fallback: If we can't get the profile, send them to select role just in case
      redirect("/select-role");
    } else if (profile?.user_type) {
      // User has a role, redirect to their specific dashboard
      logger.info('Auth layout: User has role, redirecting', { userId: user.id, role: profile.user_type });
      const redirectPath =
        profile.user_type === 'patient' ? '/patient/' :
        profile.user_type === 'research-partner' ? '/research-partner/' :
        profile.user_type === 'developer' ? '/developer/' :
        '/select-role'; // Fallback just in case role is unexpected
      redirect(redirectPath);
    } else {
      // User is logged in but has no role, redirect to select role page
      logger.info('Auth layout: User has no role, redirecting to select-role', { userId: user.id });
      redirect("/select-role");
    }
  }

  // If no user, render the login/register/forgot-password page
  return children
} 