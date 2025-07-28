import { supabase } from "@/lib/supabase"

// Type definitions for user profile
export type UserProfile = {
  id: string
  email?: string
  name?: string
  created_at?: string
}

// Function to get or create a user profile
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) return null

  // For authenticated users, use Supabase
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  if (!data) {
    // Create a new profile if it doesn't exist
    const { data: newProfile, error: createError } = await supabase
      .from("profiles")
      .insert([{ id: userId }])
      .select()
      .single()

    if (createError) {
      console.error("Error creating user profile:", createError)
      return null
    }

    return newProfile
  }

  return data
}

// Function to update user profile basic info
export async function updateUserProfile(
  userId: string,
  profileData: Partial<UserProfile>,
): Promise<UserProfile | null> {
  if (!userId) return null

  // For authenticated users, use Supabase
  const { data, error } = await supabase.from("profiles").update(profileData).eq("id", userId).select().single()

  if (error) {
    console.error("Error updating user profile:", error)
    return null
  }

  return data
}
