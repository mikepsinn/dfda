"use server"

import { createServerClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/server"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]
type UserTypeEnum = Database["public"]["Enums"]["user_type_enum"]

export async function getProfileByIdAction(id: string): Promise<Profile | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (error) {
    logger.error("Error fetching profile:", error)
    throw new Error("Failed to fetch profile")
  }

  return data as Profile
}

export async function getProfilesByTypeAction(type: UserTypeEnum): Promise<Profile[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_type", type)
    .order("created_at", { ascending: false })

  if (error) {
    logger.error("Error fetching profiles by type:", error)
    throw new Error("Failed to fetch profiles by type")
  }

  return data as Profile[]
}

export async function createProfileAction(profile: ProfileInsert): Promise<Profile> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from("profiles").insert(profile).select().single()

  if (error) {
    logger.error("Error creating profile:", error)
    throw new Error("Failed to create profile")
  }

  return data as Profile
}

export async function updateProfileAction(id: string, updates: ProfileUpdate): Promise<Profile> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    logger.error("Error updating profile:", error)
    throw new Error("Failed to update profile")
  }

  return data as Profile
}

export async function deleteProfileAction(id: string): Promise<void> {
  const supabase = await createServerClient()
  const { error } = await supabase.from("profiles").delete().eq("id", id)

  if (error) {
    logger.error("Error deleting profile:", error)
    throw new Error("Failed to delete profile")
  }
}

export async function getCurrentUserProfileAction(): Promise<Profile | null> {
  const supabase = await createServerClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    logger.error("Error getting current user:", userError)
    return null
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    logger.error("Error fetching current profile:", error)
    return null
  }

  return data as Profile
}

export async function updateUserProfileTimezoneAction(timezone: string): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        logger.error("Timezone update: User not authenticated", { error: authError });
        return { success: false, error: "Authentication failed." }; 
    }

    if (!timezone || typeof timezone !== 'string' || timezone.length === 0) {
        logger.warn("Timezone update: Invalid timezone provided", { userId: user.id, timezone });
        return { success: false, error: "Invalid timezone." };
    }

    try {
        logger.info("Attempting to update profile timezone", { userId: user.id, timezone });
        
        // Simple direct update without any conditions or JSON operators
        const { error: updateError } = await supabase
            .from("profiles")
            .update({ timezone: timezone })
            .eq("id", user.id);
                
        if (updateError) {
            logger.error("Failed to update profile timezone", { userId: user.id, timezone, error: updateError });
            return { success: false, error: "Failed to update profile." };
        }
            
        logger.info("Profile timezone update executed", { userId: user.id, timezone });
        return { success: true };

    } catch (error) {
        logger.error("Unexpected error updating profile timezone", { userId: user.id, timezone, error });
        return { success: false, error: "An unexpected error occurred." };
    }
} 