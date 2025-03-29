"use server"

import { createServerClient } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { handleDatabaseResponse, handleDatabaseCollectionResponse, handleDatabaseMutationResponse } from "@/lib/actions-helpers"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

export type Treatment = Database["public"]["Tables"]["treatments"]["Row"]
export type TreatmentInsert = Database["public"]["Tables"]["treatments"]["Insert"]
export type TreatmentUpdate = Database["public"]["Tables"]["treatments"]["Update"]

// Get all treatments
export async function getTreatmentsAction() {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatments")
    .select("*")
    .order("name")

  if (response.error) {
    logger.error("Error fetching treatments:", { error: response.error })
    throw new Error("Failed to fetch treatments")
  }

  return handleDatabaseCollectionResponse<Treatment>(response)
}

// Get a treatment by ID
export async function getTreatmentByIdAction(id: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatments")
    .select("*")
    .eq("id", id)
    .single()

  if (response.error) {
    logger.error("Error fetching treatment:", { error: response.error })
    throw new Error("Failed to fetch treatment")
  }

  return handleDatabaseResponse<Treatment>(response)
}

// Search treatments by name
export async function searchTreatmentsAction(query: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatments")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(10)

  if (response.error) {
    logger.error("Error searching treatments:", { error: response.error })
    throw new Error("Failed to search treatments")
  }

  return handleDatabaseCollectionResponse<Treatment>(response)
}

// Get treatments for a specific condition
export async function getTreatmentsForConditionAction(conditionId: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatment_ratings")
    .select(`
      id,
      effectiveness_out_of_ten,
      treatments:treatment_id(*)
    `)
    .eq("condition_id", conditionId)
    .order("effectiveness_out_of_ten", { ascending: false })

  if (response.error) {
    logger.error("Error fetching treatments for condition:", { error: response.error })
    throw new Error("Failed to fetch treatments for condition")
  }

  return response.data.map((item) => ({
    ...item.treatments,
    effectiveness_out_of_ten: item.effectiveness_out_of_ten,
  }))
}

// Create a new treatment
export async function createTreatmentAction(treatment: TreatmentInsert) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatments")
    .insert(treatment)
    .select()
    .single()

  if (response.error) {
    logger.error("Error creating treatment:", { error: response.error })
    throw new Error("Failed to create treatment")
  }

  // Revalidate relevant paths
  revalidatePath("/treatments")
  
  return handleDatabaseResponse<Treatment>(response)
}

// Update a treatment
export async function updateTreatmentAction(id: string, updates: TreatmentUpdate) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (response.error) {
    logger.error("Error updating treatment:", { error: response.error })
    throw new Error("Failed to update treatment")
  }

  // Revalidate relevant paths
  revalidatePath(`/treatment/${id}`)
  revalidatePath("/treatments")
  
  return handleDatabaseResponse<Treatment>(response)
}

// Delete a treatment
export async function deleteTreatmentAction(id: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("treatments")
    .delete()
    .eq("id", id)

  if (response.error) {
    logger.error("Error deleting treatment:", { error: response.error })
    throw new Error("Failed to delete treatment")
  }

  // Revalidate relevant paths
  revalidatePath("/treatments")
  
  return handleDatabaseMutationResponse<Treatment>(
    response, 
    "Failed to delete treatment"
  )
}
