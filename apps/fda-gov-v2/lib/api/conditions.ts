import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"
import { handleDatabaseResponse, handleDatabaseCollectionResponse, handleDatabaseMutationResponse } from "./helpers"

export type Condition = Database["public"]["Tables"]["conditions"]["Row"]
export type ConditionInsert = Database["public"]["Tables"]["conditions"]["Insert"]
export type ConditionUpdate = Database["public"]["Tables"]["conditions"]["Update"]

// Get all conditions
export async function getConditions() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const response = await supabase.from("conditions").select("*").order("name")

  if (response.error) {
    console.error("Error fetching conditions:", response.error)
    throw new Error("Failed to fetch conditions")
  }

  return handleDatabaseCollectionResponse<Condition>(response)
}

// Get a condition by ID
export async function getConditionById(id: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const response = await supabase.from("conditions").select("*").eq("id", id).single()

  if (response.error) {
    console.error("Error fetching condition:", response.error)
    throw new Error("Failed to fetch condition")
  }

  return handleDatabaseResponse<Condition>(response)
}

// Search conditions by name
export async function searchConditions(query: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

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
export async function createCondition(condition: ConditionInsert) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const response = await supabase.from("conditions").insert(condition).select().single()

  if (response.error) {
    console.error("Error creating condition:", response.error)
    throw new Error("Failed to create condition")
  }

  return handleDatabaseResponse<Condition>(response)
}

// Update a condition
export async function updateCondition(id: string, updates: ConditionUpdate) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

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

  return handleDatabaseResponse<Condition>(response)
}

// Delete a condition
export async function deleteCondition(id: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const response = await supabase.from("conditions").delete().eq("id", id)

  return handleDatabaseMutationResponse<Condition>(response, "Failed to delete condition")
}

