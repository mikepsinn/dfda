"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
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
  research_partners?: { id: string; name: string }[]
}

// Types for provider dashboard
type FetchedTrial = Database["public"]["Tables"]["trials"]["Row"] & {
  trial_enrollments: Database["public"]["Tables"]["trial_enrollments"]["Row"][];
  trial_actions: (Database["public"]["Tables"]["trial_actions"]["Row"] & {
    action_type: Database["public"]["Tables"]["action_types"]["Row"]
  })[];
  research_partner_profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
}

type FetchedPatient = Database["public"]["Tables"]["patients"]["Row"] & {
  profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  conditions: { 
    condition: { 
      id: string; 
      global_variables: {
        name: string;
      }
    } | null 
  }[];
}

// Find trials matching the given condition IDs
export async function findTrialsForConditionsAction(
  conditionIds: string[]
): Promise<TrialWithRelations[]> {
  if (!conditionIds.length) {
    return []
  }

  const supabase = await createClient()

  const response = await supabase
    .from("trials")
    .select(`
      *,
      global_conditions:condition_id(id, name),
      global_treatments:treatment_id(id, name),
      research_partners:research_partner_id(id, name)
    `)
    .in("condition_id", conditionIds)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (response.error) {
    logger.error("Error finding trials:", response.error)
    throw new Error("Failed to find trials")
  }

  return response.data as unknown as TrialWithRelations[]
}

// Get a trial by ID
export async function getTrialByIdAction(id: string): Promise<TrialWithRelations | null> {
  const supabase = await createClient()

  const response = await supabase
    .from("trials")
    .select(`
      *,
      global_conditions:condition_id(id, name),
      global_treatments:treatment_id(id, name),
      research_partners:research_partner_id(id, name)
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
  const supabase = await createClient()
  
  const response = await supabase
    .from("trials")
    .select(`
      *,
      global_conditions:condition_id(id, name),
      global_treatments:treatment_id(id, name),
      research_partners:research_partner_id(id, name)
    `)
    .order("created_at", { ascending: false })

  if (response.error) {
    logger.error("Error fetching trials:", response.error)
    throw new Error("Failed to fetch trials")
  }

  return response.data as unknown as TrialWithRelations[]
}

// Get trials by condition
export async function getTrialsByConditionAction(conditionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("trials")
    .select(`
      *,
      research_partner:profiles!trials_research_partner_id_fkey (
        first_name,
        last_name
      )
    `)
    .eq("condition_id", conditionId)
    .eq("status", "active")

  if (error) {
    logger.error("Error fetching trials by condition:", { error, conditionId })
    throw new Error("Failed to fetch trials")
  }

  if (!data) {
    return [];
  }

  return data.map(trial => ({
    ...trial,
    research_partner_name: trial.research_partner ? 
      `${trial.research_partner.first_name || ''} ${trial.research_partner.last_name || ''}`.trim() || 'Unknown Sponsor' 
      : 'Unknown Sponsor'
  }))
}

// Get trials by treatment
export async function getTrialsByTreatmentAction(treatmentId: string): Promise<TrialWithRelations[]> {
  const supabase = await createClient()
  
  const response = await supabase
    .from("trials")
    .select(`
      *,
      global_conditions:condition_id(id, name),
      global_treatments:treatment_id(id, name),
      research_partners:research_partner_id(id, name)
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
  const supabase = await createClient()
  
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
  revalidatePath("/research-partner/")
  return response.data
}

// Update a trial
export async function updateTrialAction(id: string, updates: TrialUpdate): Promise<Trial> {
  const supabase = await createClient()
  
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
  revalidatePath("/research-partner/")
  return response.data
}

// Delete a trial
export async function deleteTrialAction(id: string): Promise<void> {
  const supabase = await createClient()
  
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
  revalidatePath("/research-partner/")
}

// Get all trials for a research partner grouped by status
export async function getResearchPartnerTrialsAction(researchPartnerId: string): Promise<{
  activeTrials: TrialWithRelations[];
  completedTrials: TrialWithRelations[];
  pendingTrials: TrialWithRelations[];
}> {
  const supabase = await createClient()
  
  const selectQuery = `
    *,
    global_conditions:condition_id(id, title, icd_code),
    global_treatments:treatment_id(id, title, treatment_type, manufacturer)
  `

  const [activeResponse, completedResponse, pendingResponse] = await Promise.all([
    supabase
      .from("trials")
      .select(selectQuery)
      .eq("research_partner_id", researchPartnerId)
      .eq("status", "active"),
    supabase
      .from("trials")
      .select(selectQuery)
      .eq("research_partner_id", researchPartnerId)
      .eq("status", "completed"),
    supabase
      .from("trials")
      .select(selectQuery)
      .eq("research_partner_id", researchPartnerId)
      .eq("status", "pending")
  ])

  if (activeResponse.error) {
    logger.error("Error fetching active trials:", activeResponse.error)
    throw new Error("Failed to fetch active trials")
  }

  if (completedResponse.error) {
    logger.error("Error fetching completed trials:", completedResponse.error)
    throw new Error("Failed to fetch completed trials")
  }

  if (pendingResponse.error) {
    logger.error("Error fetching pending trials:", pendingResponse.error)
    throw new Error("Failed to fetch pending trials")
  }

  return {
    activeTrials: activeResponse.data as unknown as TrialWithRelations[],
    completedTrials: completedResponse.data as unknown as TrialWithRelations[],
    pendingTrials: pendingResponse.data as unknown as TrialWithRelations[]
  }
}

// Get trial by ID with all relations for metadata
export async function getTrialForMetadataAction(trialId: string) {
  const supabase = await createClient()
  
  const { data: trial, error } = await supabase
    .from("trials")
    .select("*")
    .eq("id", trialId)
    .single()

  if (error && error.code !== 'PGRST116') { // Ignore not found error
    logger.error("Error fetching trial for metadata:", error)
    throw new Error("Failed to fetch trial metadata")
  }

  return trial
}

// Get detailed trial data with all relations
export async function getTrialDetailsAction(trialId: string) {
  const supabase = await createClient()
  
  const { data: trial, error } = await supabase
    .from("trials")
    .select(`
      *,
      research_partner:research_partner_id(name),
      condition:condition_id(name),
      treatment:treatment_id(name),
      protocol_versions(*)
    `)
    .eq("id", trialId)
    .single()

  if (error) {
    logger.error("Error fetching trial details:", error)
    throw new Error("Failed to fetch trial details")
  }

  return trial
}

// Get active trials with enrollments and actions for provider dashboard
export async function getProviderActiveTrialsAction(): Promise<FetchedTrial[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("trials")
    .select(`
      *,
      trial_enrollments!inner (*),
      trial_actions!inner ( *,
        action_type:action_types!inner (*) ),
      research_partner_profile:profiles!trials_research_partner_id_fkey (*)
    `)
    .eq("status", "active")
    .is("deleted_at", null)

  if (error) {
    logger.error("Error fetching active trials for provider:", error)
    throw new Error("Failed to fetch active trials")
  }

  return data as FetchedTrial[]
}

// Get eligible patients with conditions for provider dashboard
export async function getProviderPatientsAction(): Promise<FetchedPatient[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("patients")
    .select(`
      *,
      profile:profiles!patients_id_fkey (*),
      conditions:patient_conditions!inner (
        condition:global_conditions!inner (
          id,
          global_variables!inner (
            name
          )
        )
      )
    `)
    .is("deleted_at", null)

  if (error) {
    logger.error("Error fetching patients for provider:", error)
    throw new Error("Failed to fetch patients")
  }

  // Cast to unknown first to handle the type mismatch with conditions
  return data as unknown as FetchedPatient[]
} 