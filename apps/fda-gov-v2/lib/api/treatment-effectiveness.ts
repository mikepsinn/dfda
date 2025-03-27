import { createServerClient } from "@/lib/supabase"
import { cookies } from "next/headers"
import type { Database } from "@/lib/database.types"

export type TreatmentEffectiveness = Database["public"]["Tables"]["treatment_effectiveness"]["Row"]
export type TreatmentEffectivenessInsert = Database["public"]["Tables"]["treatment_effectiveness"]["Insert"]
export type TreatmentEffectivenessUpdate = Database["public"]["Tables"]["treatment_effectiveness"]["Update"]

// Get effectiveness data for a treatment and condition
export async function getTreatmentEffectiveness(treatmentId: string, conditionId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase
    .from("treatment_effectiveness")
    .select("*")
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)
    .single()

  if (error) {
    console.error("Error fetching treatment effectiveness:", error)
    throw new Error("Failed to fetch treatment effectiveness")
  }

  return data as TreatmentEffectiveness
}

// Get all effectiveness data for a condition
export async function getEffectivenessForCondition(conditionId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase
    .from("treatment_effectiveness")
    .select(`
      *,
      treatments:treatment_id(id, name)
    `)
    .eq("condition_id", conditionId)
    .order("effectiveness_score", { ascending: false })

  if (error) {
    console.error("Error fetching effectiveness for condition:", error)
    throw new Error("Failed to fetch effectiveness for condition")
  }

  return data
}

// Create new effectiveness data
export async function createTreatmentEffectiveness(effectiveness: TreatmentEffectivenessInsert) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase.from("treatment_effectiveness").insert(effectiveness).select().single()

  if (error) {
    console.error("Error creating treatment effectiveness:", error)
    throw new Error("Failed to create treatment effectiveness")
  }

  return data as TreatmentEffectiveness
}

// Update effectiveness data
export async function updateTreatmentEffectiveness(
  treatmentId: string,
  conditionId: string,
  updates: TreatmentEffectivenessUpdate,
) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { data, error } = await supabase
    .from("treatment_effectiveness")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)
    .select()
    .single()

  if (error) {
    console.error("Error updating treatment effectiveness:", error)
    throw new Error("Failed to update treatment effectiveness")
  }

  return data as TreatmentEffectiveness
}

// Delete effectiveness data
export async function deleteTreatmentEffectiveness(treatmentId: string, conditionId: string) {
  const cookieStore = cookies()
  const supabase = createServerClient(cookieStore)

  const { error } = await supabase
    .from("treatment_effectiveness")
    .delete()
    .eq("treatment_id", treatmentId)
    .eq("condition_id", conditionId)

  if (error) {
    console.error("Error deleting treatment effectiveness:", error)
    throw new Error("Failed to delete treatment effectiveness")
  }

  return true
}

