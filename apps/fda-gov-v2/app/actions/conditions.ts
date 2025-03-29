"use server"

import { createServerClient } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { handleDatabaseResponse, handleDatabaseCollectionResponse, handleDatabaseMutationResponse } from "@/lib/actions-helpers"
import { revalidatePath } from "next/cache"

// Use the database view type directly 
type ConditionView = Database["public"]["Views"]["patient_conditions_view"]["Row"]
type ConditionInsert = Database["public"]["Tables"]["conditions"]["Insert"]
type ConditionUpdate = Database["public"]["Tables"]["conditions"]["Update"]

// Get all conditions from the view which includes the name
export async function getConditionsAction(): Promise<ConditionView[]> {
  const supabase = await createServerClient()

  // Query the patient_conditions_view which already has the joins
  const response = await supabase
    .from("patient_conditions_view")
    .select("*")
    .order("condition_name")
    .limit(50)

  if (response.error) {
    console.error("Error fetching conditions:", response.error)
    throw new Error("Failed to fetch conditions")
  }

  return response.data;
}

// Get a condition by ID with joined name from global_variables
export async function getConditionByIdAction(id: string): Promise<ConditionView | null> {
  const supabase = await createServerClient()

  // Query the patient_conditions_view which already has the joins
  const response = await supabase
    .from("patient_conditions_view")
    .select("*")
    .eq("condition_id", id)
    .limit(1)
    .single()

  if (response.error) {
    if (response.error.code === 'PGRST116') {
      // Not found
      return null;
    }
    console.error("Error fetching condition:", response.error)
    throw new Error("Failed to fetch condition")
  }

  return response.data;
}

// Search conditions by name
export async function searchConditionsAction(query: string): Promise<ConditionView[]> {
  const supabase = await createServerClient()

  // Query the patient_conditions_view which already has the joins
  const response = await supabase
    .from("patient_conditions_view")
    .select("*")
    .ilike("condition_name", `%${query}%`)
    .order("condition_name")
    .limit(10)

  if (response.error) {
    console.error("Error searching conditions:", response.error)
    throw new Error("Failed to search conditions")
  }

  return response.data;
}

// Create a new condition
export async function createConditionAction(condition: ConditionInsert) {
  const supabase = await createServerClient()

  const response = await supabase.from("conditions").insert(condition).select().single()

  if (response.error) {
    console.error("Error creating condition:", response.error)
    throw new Error("Failed to create condition")
  }

  revalidatePath("/admin/conditions") // Example path, adjust as needed
  revalidatePath("/") // Revalidate root or specific data-displaying paths
  return response.data;
}

// Update a condition
export async function updateConditionAction(id: string, updates: ConditionUpdate) {
  const supabase = await createServerClient()

  const response = await supabase
    .from("conditions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (response.error) {
    console.error("Error updating condition:", response.error)
    throw new Error("Failed to update condition")
  }

  revalidatePath(`/admin/conditions/${id}`) // Example
  revalidatePath("/admin/conditions")
  revalidatePath("/")
  return response.data;
}

// Delete a condition
export async function deleteConditionAction(id: string) {
  const supabase = await createServerClient()

  const response = await supabase.from("conditions").delete().eq("id", id)

  revalidatePath("/admin/conditions")
  revalidatePath("/")
  return response.status === 204; // Success
}
