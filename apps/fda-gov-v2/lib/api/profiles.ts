import { createServerClient } from "@/lib/supabase"

import type { Database } from "@/lib/database.types"

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"]
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

// Get a user profile by ID
export async function getProfileById(id: string) {
  
  const supabase = createServerClient()

  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching profile:", error)
    throw new Error("Failed to fetch profile")
  }

  return data as Profile
}

// Get profiles by user type
export async function getProfilesByType(userType: string) {
  
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_type", userType)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching profiles by type:", error)
    throw new Error("Failed to fetch profiles by type")
  }

  return data as Profile[]
}

// Create a new profile
export async function createProfile(profile: ProfileInsert) {
  
  const supabase = createServerClient()

  const { data, error } = await supabase.from("profiles").insert(profile).select().single()

  if (error) {
    console.error("Error creating profile:", error)
    throw new Error("Failed to create profile")
  }

  return data as Profile
}

// Update a profile
export async function updateProfile(id: string, updates: ProfileUpdate) {
  
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating profile:", error)
    throw new Error("Failed to update profile")
  }

  return data as Profile
}

// Delete a profile
export async function deleteProfile(id: string) {
  
  const supabase = createServerClient()

  const { error } = await supabase.from("profiles").delete().eq("id", id)

  if (error) {
    console.error("Error deleting profile:", error)
    throw new Error("Failed to delete profile")
  }

  return true
}

// Get the current user's profile
export async function getCurrentProfile() {
  
  const supabase = createServerClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("Error getting current user:", userError)
    return null
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (error) {
    console.error("Error fetching current profile:", error)
    return null
  }

  return data as Profile
}

