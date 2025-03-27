import { createServerSupabaseClient } from "../supabase"
import type { Database } from "../database.types"

export type Trial = Database["public"]["Tables"]["trials"]["Row"]
export type TrialInsert = Database["public"]["Tables"]["trials"]["Insert"]
export type TrialUpdate = Database["public"]["Tables"]["trials"]["Update"]

export async function getTrials() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("trials")
    .select(`
      *,
      conditions:condition_id(id, name),
      treatments:treatment_id(id, name),
      sponsors:sponsor_id(id, name)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching trials:", error)
    throw error
  }

  return data
}

export async function getTrialById(id: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("trials")
    .select(`
      *,
      conditions:condition_id(id, name),
      treatments:treatment_id(id, name),
      sponsors:sponsor_id(id, name)
    `)
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching trial with id ${id}:`, error)
    throw error
  }

  return data
}

export async function getTrialsByCondition(conditionId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("trials")
    .select(`
      *,
      conditions:condition_id(id, name),
      treatments:treatment_id(id, name),
      sponsors:sponsor_id(id, name)
    `)
    .eq("condition_id", conditionId)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    console.error(`Error fetching trials for condition ${conditionId}:`, error)
    throw error
  }

  return data
}

export async function getTrialsByTreatment(treatmentId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("trials")
    .select(`
      *,
      conditions:condition_id(id, name),
      treatments:treatment_id(id, name),
      sponsors:sponsor_id(id, name)
    `)
    .eq("treatment_id", treatmentId)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    console.error(`Error fetching trials for treatment ${treatmentId}:`, error)
    throw error
  }

  return data
}

export async function createTrial(trial: TrialInsert) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("trials").insert(trial).select().single()

  if (error) {
    console.error("Error creating trial:", error)
    throw error
  }

  return data
}

export async function updateTrial(id: string, updates: TrialUpdate) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("trials")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating trial with id ${id}:`, error)
    throw error
  }

  return data
}

export async function deleteTrial(id: string) {
  const supabase = createServerSupabaseClient()
  const { error } = await supabase.from("trials").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting trial with id ${id}:`, error)
    throw error
  }

  return true
}

