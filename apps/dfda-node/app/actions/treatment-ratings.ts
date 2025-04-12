"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { handleDatabaseResponse, handleDatabaseCollectionResponse } from '@/lib/actions-helpers'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export type TreatmentRating = Database['public']['Tables']['treatment_ratings']['Row'] & {
  profiles?: {
    first_name: string | null
    last_name: string | null
    user_type: string | null
  } | null
}
export type TreatmentRatingInsert = Database['public']['Tables']['treatment_ratings']['Insert']
export type TreatmentRatingUpdate = Database['public']['Tables']['treatment_ratings']['Update']

// Get all ratings for a treatment and condition
export async function getTreatmentRatingsAction(treatmentId: string, conditionId: string): Promise<TreatmentRating[]> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatment_ratings')
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        user_type
      )
    `)
    .eq('treatment_id', treatmentId)
    .eq('condition_id', conditionId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (response.error) {
    logger.error('Error fetching treatment ratings:', { error: response.error })
    throw new Error('Failed to fetch treatment ratings')
  }

  return handleDatabaseCollectionResponse(response)
}

// Get a specific rating by ID
export async function getTreatmentRatingByIdAction(id: string): Promise<TreatmentRating | null> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatment_ratings')
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        user_type
      )
    `)
    .eq('id', id)
    .single()

  if (response.error) {
    logger.error('Error fetching treatment rating:', { error: response.error })
    throw new Error('Failed to fetch treatment rating')
  }

  return handleDatabaseResponse(response)
}

// Get a user's rating for a treatment and condition
export async function getUserTreatmentRatingAction(userId: string, treatmentId: string, conditionId: string): Promise<TreatmentRating | null> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatment_ratings')
    .select('*')
    .eq('user_id', userId)
    .eq('treatment_id', treatmentId)
    .eq('condition_id', conditionId)
    .is('deleted_at', null)
    .single()

  if (response.error && response.error.code !== 'PGRST116') {
    // PGRST116 is "no rows returned" error
    logger.error('Error fetching user treatment rating:', { error: response.error })
    throw new Error('Failed to fetch user treatment rating')
  }

  return response.error ? null : handleDatabaseResponse<TreatmentRating>(response)
}

// Get average rating for a treatment and condition
export async function getAverageTreatmentRatingAction(treatmentId: string, conditionId: string) {
  const supabase = await createClient()

  const response = await supabase.rpc('get_average_treatment_rating', {
    p_treatment_id: treatmentId,
    p_condition_id: conditionId
  })

  if (response.error) {
    logger.error('Error fetching average treatment rating:', { error: response.error })
    throw new Error('Failed to fetch average treatment rating')
  }

  return response.data[0]
}

// Create a new rating
export async function createTreatmentRatingAction(rating: TreatmentRatingInsert): Promise<TreatmentRating> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatment_ratings')
    .insert(rating)
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        user_type
      )
    `)
    .single()

  if (response.error) {
    logger.error('Error creating treatment rating:', { error: response.error })
    throw new Error('Failed to create treatment rating')
  }

  // Revalidate relevant paths
  if ('treatment_id' in rating && rating.treatment_id) {
    revalidatePath(`/treatment/${rating.treatment_id}`)
  }
  if ('condition_id' in rating && rating.condition_id) {
    revalidatePath(`/condition/${rating.condition_id}`)
  }
  
  return handleDatabaseResponse<TreatmentRating>(response)
}

// Update a rating
export async function updateTreatmentRatingAction(id: string, updates: TreatmentRatingUpdate): Promise<TreatmentRating> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatment_ratings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      profiles:user_id (
        first_name,
        last_name,
        user_type
      )
    `)
    .single()

  if (response.error) {
    logger.error('Error updating treatment rating:', { error: response.error })
    throw new Error('Failed to update treatment rating')
  }

  // Get the rating to revalidate the correct paths
  const rating = await getTreatmentRatingByIdAction(id)
  if (rating) {
    revalidatePath(`/treatment/${rating.treatment_id}`)
    revalidatePath(`/condition/${rating.condition_id}`)
  }
  
  return handleDatabaseResponse<TreatmentRating>(response)
}

// Delete a rating
export async function deleteTreatmentRatingAction(id: string): Promise<void> {
  const supabase = await createClient()
  
  // Get the rating before deleting to revalidate the correct paths
  const rating = await getTreatmentRatingByIdAction(id)

  const response = await supabase
    .from('treatment_ratings')
    .delete()
    .eq('id', id)

  if (response.error) {
    logger.error('Error deleting treatment rating:', { error: response.error })
    throw new Error('Failed to delete treatment rating')
  }

  // Revalidate relevant paths
  if (rating) {
    revalidatePath(`/treatment/${rating.treatment_id}`)
    revalidatePath(`/condition/${rating.condition_id}`)
  }
}

// Mark a rating as helpful
export async function markRatingAsHelpfulAction(id: string): Promise<boolean> {
  const supabase = await createClient()

  const response = await supabase.rpc('increment_helpful_count', {
    p_rating_id: id,
  })

  if (response.error) {
    logger.error('Error marking rating as helpful:', { error: response.error })
    throw new Error('Failed to mark rating as helpful')
  }

  // Get the rating to revalidate the correct paths
  const rating = await getTreatmentRatingByIdAction(id)
  if (rating) {
    revalidatePath(`/treatment/${rating.treatment_id}`)
    revalidatePath(`/condition/${rating.condition_id}`)
  }
  
  return true
}

/**
 * Adds a treatment rating for a specific user and condition.
 * @param ratingData The data for the new treatment rating.
 * This function differs from createTreatmentRatingAction by returning a success/error structure
 * suitable for form submissions and not selecting profile data by default.
 */
export async function addTreatmentRatingAction(ratingData: TreatmentRatingInsert) {
  // Basic validation
  if (!ratingData.user_id || !ratingData.treatment_id) {
    logger.error("Missing user_id or treatment_id for addTreatmentRatingAction", { ratingData })
    throw new Error("User ID and Treatment ID are required.")
  }
  // Ensure condition_id is present, even if null (for "Not Specified")
  if (ratingData.condition_id === undefined) {
    logger.error("Missing condition_id for addTreatmentRatingAction", { ratingData })
    throw new Error("Condition ID is required (can be null).")
  }
  // Effectiveness required only if condition_id is not null
  if (ratingData.condition_id !== null && ratingData.effectiveness_out_of_ten === undefined) {
    logger.error("Missing effectiveness for addTreatmentRatingAction when condition is specified", { ratingData })
    throw new Error("Effectiveness is required when a specific condition is selected.")
  }

  const supabase = await createClient()
  logger.info("Attempting to add treatment rating", { ratingData })

  try {
    // Prepare the data, ensuring nulls are handled correctly
    const insertData: TreatmentRatingInsert = {
      ...ratingData,
      condition_id: ratingData.condition_id,
      effectiveness_out_of_ten: ratingData.effectiveness_out_of_ten ?? null,
      review: ratingData.review || null, // Ensure empty string becomes null
      // unit_id IS required - ensure it's provided in ratingData
      // helpful_count defaults to null or 0 based on schema
    }

    const { data: newRating, error: insertError } = await supabase
      .from("treatment_ratings")
      .insert(insertData)
      .select() // Select only the inserted row data
      .single()

    if (insertError) {
      logger.error("Error adding treatment rating", { ratingData, error: insertError })
      throw insertError
    }

    logger.info("Successfully added treatment rating", { newRating })

    // Revalidate paths
    revalidatePath("/patient/treatments")
    if (ratingData.treatment_id) {
        revalidatePath(`/treatments/${ratingData.treatment_id}`)
    }
    if (ratingData.condition_id) {
        revalidatePath(`/conditions/${ratingData.condition_id}`)
    }

    return { success: true, data: newRating, message: "Treatment rating added successfully." }

  } catch (error) {
    logger.error("Failed in addTreatmentRatingAction", { ratingData, error })
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." }
  }
}
