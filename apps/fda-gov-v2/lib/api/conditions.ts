import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export type Condition = Database["public"]["Tables"]["conditions"]["Row"]
export type ConditionInsert = Database["public"]["Tables"]["conditions"]["Insert"]
export type ConditionUpdate = Database["public"]["Tables"]["conditions"]["Update"]

// Get all conditions
export async function getConditions() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase.from("conditions").select("*").order("name")

  if (error) {
    console.error("Error fetching conditions:", error)
    throw new Error("Failed to fetch conditions")
  }

  return data as Condition[]
}

// Get a condition by ID
export async function getConditionById(id: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase.from("conditions").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching condition:", error)
    throw new Error("Failed to fetch condition")
  }

  return data as Condition
}

// Search conditions by name
export async function searchConditions(query: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase
    .from("conditions")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(10)

  if (error) {
    console.error("Error searching conditions:", error)
    throw new Error("Failed to search conditions")
  }

  return data as Condition[]
}

// Create a new condition
export async function createCondition(condition: ConditionInsert) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase.from("conditions").insert(condition).select().single()

  if (error) {
    console.error("Error creating condition:", error)
    throw new Error("Failed to create condition")
  }

  return data as Condition
}

// Update a condition
export async function updateCondition(id: string, updates: ConditionUpdate) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase
    .from("conditions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating condition:", error)
    throw new Error("Failed to update condition")
  }

  return data as Condition
}

// Delete a condition
export async function deleteCondition(id: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { error } = await supabase.from("conditions").delete().eq("id", id)

  if (error) {
    console.error("Error deleting condition:", error)
    throw new Error("Failed to delete condition")
  }

  return true
}

