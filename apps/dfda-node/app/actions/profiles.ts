"use server"

import { createServerClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]
type UserRoleEnum = Database["public"]["Enums"]["user_role_enum"]

export async function getProfileByIdAction(id: string): Promise<Profile | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (error) {
    logger.error("Error fetching profile:", error)
    throw new Error("Failed to fetch profile")
  }

  return data as Profile
}

export async function getProfilesByTypeAction(type: UserRoleEnum): Promise<Profile[]> {
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