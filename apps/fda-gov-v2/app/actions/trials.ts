"use server"

import { createServerClient } from "@/lib/supabase"
import type { Database } from "@/lib/database.types"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"

// Use the database types directly
export type Trial = Database["public"]["Tables"]["trials"]["Row"]
export type TrialInsert = Database["public"]["Tables"]["trials"]["Insert"]
export type TrialUpdate = Database["public"]["Tables"]["trials"]["Update"]
export type Enrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"]

// Type for trials with joined relations
export type TrialWithRelations = Trial & {
  conditions?: { id: string; name: string }[]
  treatments?: { id: string; name: string }[]
  sponsors?: { id: string; name: string }[]
}

// Find trials matching the given condition IDs
export async function findTrialsForConditionsAction(
  conditionIds: string[]
): Promise<TrialWithRelations[]> {
  if (!conditionIds.length) {
    return []
  }

  const supabase = createServerClient()

  const response = await supabase
    .from("trials")
    .select(`
      *,
      conditions:condition_id(id, name),
      treatments:treatment_id(id, name),
      sponsors:sponsor_id(id, name)
    `)
    .in("condition_id", conditionIds)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (response.error) {
    logger.error("Error finding trials:", response.error)
    throw new Error("Failed to find trials")
  }

  // Return results as TrialWithRelations[]
  return response.data as unknown as TrialWithRelations[]
}

// Get a trial by ID
export async function getTrialByIdAction(id: string): Promise<TrialWithRelations | null> {
  const supabase = createServerClient()

  const response = await supabase
    .from("trials")
    .select(`
      *,
      conditions:condition_id(id, name),
      treatments:treatment_id(id, name),
      sponsors:sponsor_id(id, name)
    `)
    .eq("id", id)
    .single()

  if (response.error) {
    if (response.error.code === 'PGRST116') {
      // Not found
      return null
    }
    logger.error("Error fetching trial:", response.error)
    throw new Error("Failed to fetch trial")
  }

  return response.data as unknown as TrialWithRelations
}

// Get all trials
export async function getTrialsAction(): Promise<TrialWithRelations[]> {
  const supabase = createServerClient()
  
  const response = await supabase
    .from("trials")
    .select(`
      *,
      conditions:condition_id(id, name),
      treatments:treatment_id(id, name),
      sponsors:sponsor_id(id, name)
    `)
    .order("created_at", { ascending: false })

  if (response.error) {
    logger.error("Error fetching trials:", response.error)
    throw new Error("Failed to fetch trials")
  }

  return response.data as unknown as TrialWithRelations[]
}

// Get trials by condition
export async function getTrialsByConditionAction(conditionId: string): Promise<TrialWithRelations[]> {
  const supabase = createServerClient()
  
  const response = await supabase
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

  if (response.error) {
    logger.error(`Error fetching trials for condition ${conditionId}:`, response.error)
    throw new Error("Failed to fetch trials for condition")
  }

  return response.data as unknown as TrialWithRelations[]
}

// Get trials by treatment
export async function getTrialsByTreatmentAction(treatmentId: string): Promise<TrialWithRelations[]> {
  const supabase = createServerClient()
  
  const response = await supabase
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

  if (response.error) {
    logger.error(`Error fetching trials for treatment ${treatmentId}:`, response.error)
    throw new Error("Failed to fetch trials for treatment")
  }

  return response.data as unknown as TrialWithRelations[]
}

// Create a new trial
export async function createTrialAction(trial: TrialInsert): Promise<Trial> {
  const supabase = createServerClient()
  
  const response = await supabase
    .from("trials")
    .insert(trial)
    .select()
    .single()

  if (response.error) {
    logger.error("Error creating trial:", response.error)
    throw new Error("Failed to create trial")
  }

  revalidatePath("/trials")
  revalidatePath("/admin/trials")
  revalidatePath("/sponsor/dashboard")
  return response.data
}

// Update a trial
export async function updateTrialAction(id: string, updates: TrialUpdate): Promise<Trial> {
  const supabase = createServerClient()
  
  const response = await supabase
    .from("trials")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (response.error) {
    logger.error(`Error updating trial with id ${id}:`, response.error)
    throw new Error("Failed to update trial")
  }

  revalidatePath(`/trials/${id}`)
  revalidatePath("/trials")
  revalidatePath("/admin/trials")
  revalidatePath("/sponsor/dashboard")
  return response.data
}

// Delete a trial
export async function deleteTrialAction(id: string): Promise<boolean> {
  const supabase = createServerClient()
  
  const response = await supabase
    .from("trials")
    .delete()
    .eq("id", id)

  if (response.error) {
    logger.error(`Error deleting trial with id ${id}:`, response.error)
    throw new Error("Failed to delete trial")
  }

  revalidatePath("/trials")
  revalidatePath("/admin/trials")
  revalidatePath("/sponsor/dashboard")
  return true
} 