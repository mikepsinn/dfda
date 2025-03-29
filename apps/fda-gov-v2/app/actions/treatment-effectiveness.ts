"use server"

import { createServerClient } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { handleDatabaseResponse, handleDatabaseCollectionResponse } from "@/lib/actions-helpers"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

export type TreatmentEffectiveness = Database["public"]["Tables"]["treatment_ratings"]["Row"]
export type TreatmentEffectivenessInsert = Database["public"]["Tables"]["treatment_ratings"]["Insert"]
export type TreatmentEffectivenessUpdate = Database["public"]["Tables"]["treatment_ratings"]["Update"]

export type EffectivenessStats = {
  total_ratings: number
  avg_effectiveness: number
  highly_effective_count: number
  ineffective_count: number
}

export type TreatmentConditionEffectiveness = {
  condition_id: string
  condition_name: string
  condition_description: string | null
} & EffectivenessStats

// Get effectiveness stats for a treatment and condition
export async function getTreatmentEffectivenessAction(treatmentId: string, conditionId: string): Promise<EffectivenessStats> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select("effectiveness_out_of_ten")
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)
    .not('deleted_at', 'is', null)

  if (response.error) {
    logger.error("Error fetching treatment effectiveness:", { error: response.error })
    throw new Error("Failed to fetch treatment effectiveness")
  }

  // Filter out null values and convert to numbers
  const ratings = response.data
    .map(r => r.effectiveness_out_of_ten)
    .filter((r): r is number => r !== null)

  return {
    total_ratings: ratings.length,
    avg_effectiveness: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    highly_effective_count: ratings.filter(r => r >= 7).length,
    ineffective_count: ratings.filter(r => r <= 3).length
  }
}

// Get all conditions a treatment has been rated for with effectiveness stats
export async function getTreatmentConditionsWithEffectivenessAction(treatmentId: string): Promise<TreatmentConditionEffectiveness[]> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select(`
      condition_id,
      conditions!inner (
        id,
        global_variables!inner (
          name,
          description
        )
      )
    `)
    .eq("treatment_id", treatmentId)
    .not('deleted_at', 'is', null)

  if (response.error) {
    logger.error("Error fetching treatment conditions:", { error: response.error })
    throw new Error("Failed to fetch treatment conditions")
  }

  // Get effectiveness stats for each condition
  const statsPromises = response.data.map(async (row) => {
    const stats = await getTreatmentEffectivenessAction(treatmentId, row.condition_id)
    
    return {
      condition_id: row.condition_id,
      condition_name: row.conditions.global_variables.name,
      condition_description: row.conditions.global_variables.description,
      ...stats
    }
  })

  return Promise.all(statsPromises)
}

// Get all effectiveness data for a condition
export async function getEffectivenessForConditionAction(conditionId: string): Promise<TreatmentEffectiveness[]> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select(`
      *,
      treatments:treatment_id(id, name)
    `)
    .eq("condition_id", conditionId)
    .not('deleted_at', 'is', null)
    .order("effectiveness_out_of_ten", { ascending: false })

  if (response.error) {
    logger.error("Error fetching effectiveness for condition:", { error: response.error })
    throw new Error("Failed to fetch effectiveness for condition")
  }

  return handleDatabaseCollectionResponse(response)
}

// Get effectiveness data by patient
export async function getTreatmentEffectivenessByPatientAction(patientId: string): Promise<TreatmentEffectiveness[]> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select("*")
    .eq("patient_id", patientId)
    .not('deleted_at', 'is', null)

  if (response.error) {
    logger.error("Error fetching treatment effectiveness:", { error: response.error })
    throw new Error("Failed to fetch treatment effectiveness")
  }

  return handleDatabaseCollectionResponse(response)
}

// Create new effectiveness data
export async function createTreatmentEffectivenessAction(effectiveness: TreatmentEffectivenessInsert): Promise<TreatmentEffectiveness> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .insert(effectiveness)
    .select()
    .single()

  if (response.error) {
    logger.error("Error creating treatment effectiveness:", { error: response.error })
    throw new Error("Failed to create treatment effectiveness")
  }

  // Revalidate relevant paths
  revalidatePath(`/treatment/${effectiveness.treatment_id}`)
  revalidatePath(`/condition/${effectiveness.condition_id}`)
  
  return handleDatabaseResponse<TreatmentEffectiveness>(response)
}

// Update effectiveness data
export async function updateTreatmentEffectivenessAction(
  treatmentId: string,
  conditionId: string,
  updates: TreatmentEffectivenessUpdate,
): Promise<TreatmentEffectiveness> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)
    .select()
    .single()

  if (response.error) {
    logger.error("Error updating treatment effectiveness:", { error: response.error })
    throw new Error("Failed to update treatment effectiveness")
  }

  // Revalidate relevant paths
  revalidatePath(`/treatment/${treatmentId}`)
  revalidatePath(`/condition/${conditionId}`)
  
  return handleDatabaseResponse<TreatmentEffectiveness>(response)
}

// Delete a treatment effectiveness rating
export async function deleteTreatmentEffectivenessAction(id: string): Promise<void> {
  const supabase = await createServerClient()

  const response = await supabase
    .from('treatment_ratings')
    .delete()
    .eq('id', id)

  if (response.error) {
    logger.error('Error deleting treatment effectiveness:', { error: response.error })
    throw new Error('Failed to delete treatment effectiveness')
  }
}

export async function getTreatmentEffectivenessByTreatmentAction(treatmentId: string): Promise<TreatmentEffectiveness[]> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select("*")
    .eq("treatment_id", treatmentId)

  if (response.error) {
    logger.error("Error fetching treatment effectiveness:", { error: response.error })
    throw new Error("Failed to fetch treatment effectiveness")
  }

  return handleDatabaseCollectionResponse(response)
}

export async function getTreatmentEffectivenessByConditionAction(conditionId: string): Promise<TreatmentEffectiveness[]> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select("*")
    .eq("condition_id", conditionId)

  if (response.error) {
    logger.error("Error fetching treatment effectiveness:", { error: response.error })
    throw new Error("Failed to fetch treatment effectiveness")
  }

  return handleDatabaseCollectionResponse(response)
}

export async function getTreatmentEffectivenessByTreatmentAndConditionAction(treatmentId: string, conditionId: string): Promise<TreatmentEffectiveness[]> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select("*")
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)

  if (response.error) {
    logger.error("Error fetching treatment effectiveness:", { error: response.error })
    throw new Error("Failed to fetch treatment effectiveness")
  }

  return handleDatabaseCollectionResponse(response)
}
