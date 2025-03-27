import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export type Treatment = Database["public"]["Tables"]["treatments"]["Row"]
export type TreatmentInsert = Database["public"]["Tables"]["treatments"]["Insert"]
export type TreatmentUpdate = Database["public"]["Tables"]["treatments"]["Update"]

// Get all treatments
export async function getTreatments() {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase.from("treatments").select("*").order("name")

  if (error) {
    console.error("Error fetching treatments:", error)
    throw new Error("Failed to fetch treatments")
  }

  return data as Treatment[]
}

// Get a treatment by ID
export async function getTreatmentById(id: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase.from("treatments").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching treatment:", error)
    throw new Error("Failed to fetch treatment")
  }

  return data as Treatment
}

// Search treatments by name
export async function searchTreatments(query: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase
    .from("treatments")
    .select("*")
    .ilike("name", `%${query}%`)
    .order("name")
    .limit(10)

  if (error) {
    console.error("Error searching treatments:", error)
    throw new Error("Failed to search treatments")
  }

  return data as Treatment[]
}

// Get treatments for a specific condition
export async function getTreatmentsForCondition(conditionId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase
    .from("treatment_effectiveness")
    .select(`
      treatment_id,
      effectiveness_score,
      side_effects_score,
      cost_effectiveness_score,
      evidence_level,
      treatments:treatment_id(*)
    `)
    .eq("condition_id", conditionId)
    .order("effectiveness_score", { ascending: false })

  if (error) {
    console.error("Error fetching treatments for condition:", error)
    throw new Error("Failed to fetch treatments for condition")
  }

  return data.map((item) => ({
    ...item.treatments,
    effectiveness_score: item.effectiveness_score,
    side_effects_score: item.side_effects_score,
    cost_effectiveness_score: item.cost_effectiveness_score,
    evidence_level: item.evidence_level,
  }))
}

// Create a new treatment
export async function createTreatment(treatment: TreatmentInsert) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase.from("treatments").insert(treatment).select().single()

  if (error) {
    console.error("Error creating treatment:", error)
    throw new Error("Failed to create treatment")
  }

  return data as Treatment
}

// Update a treatment
export async function updateTreatment(id: string, updates: TreatmentUpdate) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase
    .from("treatments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error("Error updating treatment:", error)
    throw new Error("Failed to update treatment")
  }

  return data as Treatment
}

// Delete a treatment
export async function deleteTreatment(id: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { error } = await supabase.from("treatments").delete().eq("id", id)

  if (error) {
    console.error("Error deleting treatment:", error)
    throw new Error("Failed to delete treatment")
  }

  return true
}

