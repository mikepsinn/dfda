"use server"

import { createServerClient } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { handleDatabaseResponse, handleDatabaseCollectionResponse, handleDatabaseMutationResponse } from "@/lib/actions-helpers"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

export type TreatmentRating = Database["public"]["Tables"]["treatment_ratings"]["Row"]
export type TreatmentRatingInsert = Database["public"]["Tables"]["treatment_ratings"]["Insert"]
export type TreatmentRatingUpdate = Database["public"]["Tables"]["treatment_ratings"]["Update"]

// Get all ratings for a treatment and condition
export async function getTreatmentRatingsAction(treatmentId: string, conditionId: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select(`
      *,
      profiles:user_id(first_name, last_name, user_type)
    `)
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)
    .order("created_at", { ascending: false })

  if (response.error) {
    logger.error("Error fetching treatment ratings:", { error: response.error })
    throw new Error("Failed to fetch treatment ratings")
  }

  return handleDatabaseCollectionResponse(response)
}

// Get a specific rating by ID
export async function getTreatmentRatingByIdAction(id: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select(`
      *,
      profiles:user_id(first_name, last_name, user_type)
    `)
    .eq("id", id)
    .single()

  if (response.error) {
    logger.error("Error fetching treatment rating:", { error: response.error })
    throw new Error("Failed to fetch treatment rating")
  }

  return handleDatabaseResponse(response)
}

// Get a user's rating for a treatment and condition
export async function getUserTreatmentRatingAction(userId: string, treatmentId: string, conditionId: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select("*")
    .eq("user_id", userId)
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)
    .single()

  if (response.error && response.error.code !== "PGRST116") {
    // PGRST116 is "no rows returned" error
    logger.error("Error fetching user treatment rating:", { error: response.error })
    throw new Error("Failed to fetch user treatment rating")
  }

  return response.error ? null : handleDatabaseResponse<TreatmentRating>(response)
}

// Get average rating for a treatment and condition
export async function getAverageTreatmentRatingAction(treatmentId: string, conditionId: string) {
  const supabase = createServerClient()

  const response = await supabase.rpc("get_average_treatment_rating", {
    p_treatment_id: treatmentId,
    p_condition_id: conditionId,
  })

  if (response.error) {
    logger.error("Error fetching average treatment rating:", { error: response.error })
    throw new Error("Failed to fetch average treatment rating")
  }

  return response.data[0]
}

// Create a new rating
export async function createTreatmentRatingAction(rating: TreatmentRatingInsert) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .insert(rating)
    .select()
    .single()

  if (response.error) {
    logger.error("Error creating treatment rating:", { error: response.error })
    throw new Error("Failed to create treatment rating")
  }

  // Revalidate relevant paths
  if ('treatment_id' in rating && rating.treatment_id) {
    revalidatePath(`/treatment/${rating.treatment_id}`)
  }
  
  return handleDatabaseResponse<TreatmentRating>(response)
}

// Update a rating
export async function updateTreatmentRatingAction(id: string, updates: TreatmentRatingUpdate) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (response.error) {
    logger.error("Error updating treatment rating:", { error: response.error })
    throw new Error("Failed to update treatment rating")
  }

  // Get the rating to revalidate the correct paths
  const rating = await getTreatmentRatingByIdAction(id) as TreatmentRating | null
  if (rating && rating.treatment_id) {
    revalidatePath(`/treatment/${rating.treatment_id}`)
  }
  
  return handleDatabaseResponse<TreatmentRating>(response)
}

// Delete a rating
export async function deleteTreatmentRatingAction(id: string) {
  const supabase = createServerClient()
  
  // Get the rating before deleting to revalidate the correct paths
  const rating = await getTreatmentRatingByIdAction(id) as TreatmentRating | null

  const response = await supabase
    .from("treatment_ratings")
    .delete()
    .eq("id", id)

  if (response.error) {
    logger.error("Error deleting treatment rating:", { error: response.error })
    throw new Error("Failed to delete treatment rating")
  }

  // Revalidate relevant paths
  if (rating && rating.treatment_id) {
    revalidatePath(`/treatment/${rating.treatment_id}`)
  }
  
  return handleDatabaseMutationResponse<TreatmentRating>(
    response, 
    "Failed to delete treatment rating"
  )
}

// Mark a rating as helpful
export async function markRatingAsHelpfulAction(id: string) {
  const supabase = createServerClient()

  const response = await supabase.rpc("increment_helpful_count", {
    p_rating_id: id,
  })

  if (response.error) {
    logger.error("Error marking rating as helpful:", { error: response.error })
    throw new Error("Failed to mark rating as helpful")
  }

  // Get the rating to revalidate the correct paths
  const rating = await getTreatmentRatingByIdAction(id) as TreatmentRating | null
  if (rating && rating.treatment_id) {
    revalidatePath(`/treatment/${rating.treatment_id}`)
  }
  
  return true
}
