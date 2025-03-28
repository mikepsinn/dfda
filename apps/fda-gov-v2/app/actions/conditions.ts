"use server"

import { createServerClient } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { handleDatabaseResponse, handleDatabaseCollectionResponse, handleDatabaseMutationResponse } from "@/lib/actions-helpers"
import { revalidatePath } from "next/cache"

export type Condition = Database["public"]["Tables"]["conditions"]["Row"]
export type ConditionInsert = Database["public"]["Tables"]["conditions"]["Insert"]
export type ConditionUpdate = Database["public"]["Tables"]["conditions"]["Update"]

// Get all conditions
export async function getConditionsAction() {
  const supabase = createServerClient()

  const response = await supabase.from("conditions").select("*").order("name")

  if (response.error) {
    console.error("Error fetching conditions:", response.error)
    throw new Error("Failed to fetch conditions")
  }

  return handleDatabaseCollectionResponse<Condition>(response)
}

// Get a condition by ID
export async function getConditionByIdAction(id: string) {
  const supabase = createServerClient()

  const response = await supabase.from("conditions").select("*").eq("id", id).single()

  if (response.error) {
    console.error("Error fetching condition:", response.error)
    throw new Error("Failed to fetch condition")
  }

  return handleDatabaseResponse<Condition>(response)
}

// Search conditions by name
export async function searchConditionsAction(query: string) {
  const supabase = createServerClient()

  const response = await supabase
    .from("conditions")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(10)

  if (response.error) {
    console.error("Error searching conditions:", response.error)
    throw new Error("Failed to search conditions")
  }

  return handleDatabaseCollectionResponse<Condition>(response)
}

// Create a new condition
export async function createConditionAction(condition: ConditionInsert) {
  const supabase = createServerClient()

  const response = await supabase.from("conditions").insert(condition).select().single()

  if (response.error) {
    console.error("Error creating condition:", response.error)
    throw new Error("Failed to create condition")
  }

  revalidatePath("/admin/conditions") // Example path, adjust as needed
  revalidatePath("/") // Revalidate root or specific data-displaying paths
  return handleDatabaseResponse<Condition>(response)
}

// Update a condition
export async function updateConditionAction(id: string, updates: ConditionUpdate) {
  const supabase = createServerClient()

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
  return handleDatabaseResponse<Condition>(response)
}

// Delete a condition
export async function deleteConditionAction(id: string) {
  const supabase = createServerClient()

  const response = await supabase.from("conditions").delete().eq("id", id)

  revalidatePath("/admin/conditions")
  revalidatePath("/")
  return handleDatabaseMutationResponse<Condition>(response, "Failed to delete condition")
}
