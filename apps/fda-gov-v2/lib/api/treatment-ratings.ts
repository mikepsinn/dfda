import { createServerClient } from "@/lib/supabase"

import type { Database } from "@/lib/database.types"

export type TreatmentRating = Database["public"]["Tables"]["treatment_ratings"]["Row"]
export type TreatmentRatingInsert = Database["public"]["Tables"]["treatment_ratings"]["Insert"]
export type TreatmentRatingUpdate = Database["public"]["Tables"]["treatment_ratings"]["Update"]

// Get all ratings for a treatment and condition
export async function getTreatmentRatings(treatmentId: string, conditionId: string) {
  
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("treatment_ratings")
    .select(`
      *,
      profiles:user_id(first_name, last_name, user_type)
    `)
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching treatment ratings:", error)
    throw new Error("Failed to fetch treatment ratings")
  }

  return data
}

// Get a specific rating by ID
export async function getTreatmentRatingById(id: string) {
  
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("treatment_ratings")
    .select(`
      *,
      profiles:user_id(first_name, last_name, user_type)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error("Error fetching treatment rating:", error)
    throw new Error("Failed to fetch treatment rating")
  }

  return data
}

// Get a user's rating for a treatment and condition
export async function getUserTreatmentRating(userId: string, treatmentId: string, conditionId: string) {
  
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("treatment_ratings")
    .select("*")
    .eq("user_id", userId)
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error
    console.error("Error fetching user treatment rating:", error)
    throw new Error("Failed to fetch user treatment rating")
  }

  return data as TreatmentRating | null
}

// Get average rating for a treatment and condition
export async function getAverageTreatmentRating(treatmentId: string, conditionId: string) {
  
  const supabase = createServerClient()

  const { data, error } = await supabase.rpc("get_average_treatment_rating", {
    p_treatment_id: treatmentId,
    p_condition_id: conditionId,
  })

  if (error) {
    console.error("Error fetching average treatment rating:", error)
    throw new Error("Failed to fetch average treatment rating")
  }

  return data[0]
}

// Alias for backward compatibility with app/treatment/[id]/page.tsx
export const getTreatmentAverageRating = getAverageTreatmentRating

// Alias for backward compatibility with components/treatment-reviews-list.tsx
export const markReviewAsHelpful = markRatingAsHelpful

// Create a new rating
export async function createTreatmentRating(rating: TreatmentRatingInsert) {
  
  const supabase = createServerClient()

  const { data, error } = await supabase.from("treatment_ratings").insert(rating).select().single()

  if (error) {
    console.error("Error creating treatment rating:", error)
    throw new Error("Failed to create treatment rating")
  }

  return data as TreatmentRating
}

// Update a rating
export async function updateTreatmentRating(id: string, updates: TreatmentRatingUpdate) {
  
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from("treatment_ratings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating treatment rating:", error)
    throw new Error("Failed to update treatment rating")
  }

  return data as TreatmentRating
}

// Delete a rating
export async function deleteTreatmentRating(id: string) {
  
  const supabase = createServerClient()

  const { error } = await supabase.from("treatment_ratings").delete().eq("id", id)

  if (error) {
    console.error("Error deleting treatment rating:", error)
    throw new Error("Failed to delete treatment rating")
  }

  return true
}

// Mark a rating as helpful
export async function markRatingAsHelpful(id: string) {
  
  const supabase = createServerClient()

  const { error } = await supabase.rpc("increment_helpful_count", {
    p_rating_id: id,
  })

  if (error) {
    console.error("Error marking rating as helpful:", error)
    throw new Error("Failed to mark rating as helpful")
  }

  return true
}

