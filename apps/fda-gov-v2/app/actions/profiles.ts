"use server"

import { createServerClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

export async function getProfileByIdAction(id: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (error) {
    logger.error("Error fetching profile:", error)
    throw new Error("Failed to fetch profile")
  }

  return data as Profile
}

export async function getProfilesByTypeAction(userType: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_type", userType)
    .order("created_at", { ascending: false })

  if (error) {
    logger.error("Error fetching profiles by type:", error)
    throw new Error("Failed to fetch profiles by type")
  }

  return data as Profile[]
}

export async function createProfileAction(profile: ProfileInsert) {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("profiles").insert(profile).select().single()

  if (error) {
    logger.error("Error creating profile:", error)
    throw new Error("Failed to create profile")
  }

  return data as Profile
}

export async function updateProfileAction(id: string, updates: ProfileUpdate) {
  const supabase = createServerClient()
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

export async function deleteProfileAction(id: string) {
  const supabase = createServerClient()
  const { error } = await supabase.from("profiles").delete().eq("id", id)

  if (error) {
    logger.error("Error deleting profile:", error)
    throw new Error("Failed to delete profile")
  }

  return true
}

export async function getCurrentProfileAction() {
  const supabase = createServerClient()
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