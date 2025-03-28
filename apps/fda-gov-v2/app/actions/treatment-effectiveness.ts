"use server"

import { createServerClient } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { handleDatabaseResponse, handleDatabaseCollectionResponse, handleDatabaseMutationResponse } from "@/lib/actions-helpers"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

export type TreatmentEffectiveness = Database["public"]["Tables"]["treatment_effectiveness"]["Row"]
export type TreatmentEffectivenessInsert = Database["public"]["Tables"]["treatment_effectiveness"]["Insert"]
export type TreatmentEffectivenessUpdate = Database["public"]["Tables"]["treatment_effectiveness"]["Update"]

// Get effectiveness data for a treatment and condition
export async function getTreatmentEffectivenessAction(treatmentId: string, conditionId: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_effectiveness")
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
export async function getEffectivenessForConditionAction(conditionId: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_effectiveness")
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
export async function createTreatmentEffectivenessAction(effectiveness: TreatmentEffectivenessInsert) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_effectiveness")
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
) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_effectiveness")
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

// Delete effectiveness data
export async function deleteTreatmentEffectivenessAction(treatmentId: string, conditionId: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_effectiveness")
    .delete()
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)

  // Revalidate relevant paths
  revalidatePath(`/treatment/${treatmentId}`)
  revalidatePath(`/condition/${conditionId}`)
  
  return handleDatabaseMutationResponse<TreatmentEffectiveness>(
    response, 
    "Failed to delete treatment effectiveness"
  )
}
