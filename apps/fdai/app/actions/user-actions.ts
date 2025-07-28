"use server"

import { getServerUser } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { logger } from "@/lib/logging"

// Create a module-specific logger
const userActionLogger = logger.createChildLogger("UserAction")

// Create a Supabase client for server actions
function getSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookieStore.set({ name, value, ...options })
      },
      remove(name: string, options: any) {
        cookieStore.set({ name, value: "", ...options })
      },
    },
  })
}

// Ensure user profile exists
export async function ensureUserProfile(userId: string) {
  const supabase = getSupabaseClient()

  userActionLogger.debug(`Ensuring user profile exists for ${userId.substring(0, 8)}...`)

  // Check if profile exists
  const { data: profile, error: profileError } = await supabase.from("profiles").select("id").eq("id", userId).single()

  if (profileError || !profile) {
    userActionLogger.info(`Creating new profile for user ${userId.substring(0, 8)}...`)

    // Create profile
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert([{ id: userId }])
      .select()

    if (createError) {
      userActionLogger.error(`Failed to create profile`, { error: createError })
      throw new Error(`Failed to create user profile: ${createError.message}`)
    }

    // Create notification preferences
    const { error: prefError } = await supabase.from("notification_preferences").insert([{ user_id: userId }])

    if (prefError) {
      userActionLogger.warn(`Failed to create notification preferences`, { error: prefError })
      // Continue anyway, this is not critical
    }

    return newProfile?.[0] || null
  }

  return profile
}

// Update user profile
export async function updateUserProfile(data: { name?: string; email?: string; check_in_time?: string }) {
  const user = await getServerUser()
  if (!user?.id) {
    return { success: false, error: "User not authenticated" }
  }

  try {
    const supabase = getSupabaseClient()

    // Ensure profile exists
    await ensureUserProfile(user.id)

    // Update profile
    const { error } = await supabase.from("profiles").update(data).eq("id", user.id)

    if (error) {
      return { success: false, error: `Failed to update profile: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
