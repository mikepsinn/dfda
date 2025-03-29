"use server"

import { createServerClient } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { handleDatabaseResponse, handleDatabaseCollectionResponse, handleDatabaseMutationResponse } from "@/lib/actions-helpers"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

export type TreatmentEffectiveness = Database["public"]["Tables"]["treatment_ratings"]["Row"]
export type TreatmentEffectivenessInsert = Database["public"]["Tables"]["treatment_ratings"]["Insert"]
export type TreatmentEffectivenessUpdate = Database["public"]["Tables"]["treatment_ratings"]["Update"]

// Get effectiveness data for a treatment and condition
export async function getTreatmentEffectivenessAction(treatmentId: string, conditionId: string): Promise<TreatmentEffectiveness> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select("*")
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)
    .single()

  if (response.error) {
    logger.error("Error fetching treatment effectiveness:", { error: response.error })
    throw new Error("Failed to fetch treatment effectiveness")
  }

  return handleDatabaseResponse<TreatmentEffectiveness>(response)
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
    .order("effectiveness_score", { ascending: false })

  if (response.error) {
    logger.error("Error fetching effectiveness for condition:", { error: response.error })
    throw new Error("Failed to fetch effectiveness for condition")
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

export async function getTreatmentEffectivenessByPatientAction(patientId: string): Promise<TreatmentEffectiveness[]> {
  const supabase = await createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select("*")
    .eq("patient_id", patientId)

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
