"use server"

import { logger } from "@/lib/logger"
import { Database } from "@/lib/database.types"
import { createClient } from "@/lib/supabase/server"

export type TrialEnrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"]
export type TrialEnrollmentInsert = Database["public"]["Tables"]["trial_enrollments"]["Insert"]
export type TrialEnrollmentUpdate = Database["public"]["Tables"]["trial_enrollments"]["Update"]

// Extended type for enrollments with relations
export type EnrollmentWithRelations = TrialEnrollment & {
  patient: {
    id: string;
    profile: Database["public"]["Tables"]["profiles"]["Row"] | null;
  } & Database["public"]["Tables"]["patients"]["Row"];
  trial: Database["public"]["Tables"]["trials"]["Row"];
  trial_actions: (Database["public"]["Tables"]["trial_actions"]["Row"] & {
    action_type: Database["public"]["Tables"]["action_types"]["Row"]
  })[];
}

export async function getTrialEnrollmentsAction(): Promise<TrialEnrollment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("trial_enrollments")
    .select(`
      *,
      trials:trial_id(
        id, 
        title,
        description, 
        status,
        treatments:treatment_id(id, title),
        conditions:condition_id(id, title)
      )
    `)
    .order("enrollment_date", { ascending: false })

  if (error) {
    logger.error(`Error fetching trial enrollments:`, error)
    throw error
  }

  return data
}

export async function getTrialEnrollmentsByPatientAction(patientId: string): Promise<TrialEnrollment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("trial_enrollments")
    .select(`
      *,
      trials:trial_id(
        id, 
        title,
        description, 
        status,
        treatments:treatment_id(id, title),
        conditions:condition_id(id, title)
      )
    `)
    .eq("patient_id", patientId)
    .order("enrollment_date", { ascending: false })

  if (error) {
    logger.error(`Error fetching trial enrollments for patient ${patientId}:`, error)
    throw error
  }

  return data
}

export async function getTrialEnrollmentsByTrialAction(trialId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("trial_enrollments")
    .select(`
      *,
      patients:patient_id(id, first_name, last_name, email)
    `)
    .eq("trial_id", trialId)
    .order("enrollment_date", { ascending: false })

  if (error) {
    logger.error(`Error fetching trial enrollments for trial ${trialId}:`, error)
    throw error
  }

  return data
}

export async function createTrialEnrollmentAction(enrollment: TrialEnrollmentInsert) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("trial_enrollments").insert(enrollment).select().single()

  if (error) {
    logger.error("Error creating trial enrollment:", error)
    throw error
  }

  return data
}

export async function updateTrialEnrollmentAction(id: string, updates: TrialEnrollmentUpdate) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("trial_enrollments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    logger.error(`Error updating trial enrollment with id ${id}:`, error)
    throw error
  }

  return data
}

export async function deleteTrialEnrollmentAction(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("trial_enrollments").delete().eq("id", id)

  if (error) {
    logger.error(`Error deleting trial enrollment with id ${id}:`, error)
    throw error
  }

  return true
}

export async function updateEnrollmentStatusAction(enrollmentId: string, status: TrialEnrollment['status']) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('trial_enrollments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .select()
    .single()

  if (error) {
    logger.error(`Error updating enrollment status for ${enrollmentId}:`, error)
    throw error
  }

  return data
}

export async function getTrialEnrollmentByIdAction(id: string): Promise<TrialEnrollment | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("trial_enrollments")
    .select()
    .eq("id", id)
    .single()

  if (error) {
    logger.error(`Error fetching trial enrollment with id ${id}:`, error)
    throw error
  }

  return data
}

export async function getTrialEnrollmentByTrialAndPatientAction(trialId: string, patientId: string): Promise<TrialEnrollment | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("trial_enrollments")
    .select()
    .eq("trial_id", trialId)
    .eq("patient_id", patientId)
    .single()

  if (error) {
    logger.error(`Error fetching trial enrollment for trial ${trialId} and patient ${patientId}:`, error)
    throw error
  }

  return data
}

// Get enrollment status for a patient in a trial
export async function getTrialEnrollmentStatusAction(trialId: string, patientId: string) {
  const supabase = await createClient()
  
  const { data: enrollment, error } = await supabase
    .from("trial_enrollments")
    .select("*")
    .eq("trial_id", trialId)
    .eq("patient_id", patientId)
    .single()

  if (error && error.code !== 'PGRST116') { // Ignore not found error
    logger.error("Error fetching trial enrollment status:", error)
    throw new Error("Failed to fetch enrollment status")
  }

  return enrollment
}

// Get enrollments with related data for provider
export async function getProviderEnrollmentsAction(providerId: string): Promise<EnrollmentWithRelations[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("trial_enrollments")
    .select(`
      *,
      patient:patients!inner ( *,
        profile:profiles!patients_id_fkey (*) ),
      trial:trials!inner (*),
      trial_actions!inner ( *,
        action_type:action_types!inner (*) )
    `)
    .eq("provider_id", providerId)
    .is("deleted_at", null)

  if (error) {
    logger.error("Error fetching enrollments for provider:", error)
    throw new Error("Failed to fetch enrollments")
  }

  return data as EnrollmentWithRelations[]
}

// Get active enrollment with trial data for a patient
export async function getPatientActiveEnrollmentAction(patientId: string) {
  const supabase = await createClient()
  
  const { data: enrollment, error } = await supabase
    .from("trial_enrollments")
    .select(`
      id,
      trial_id,
      patient_id,
      provider_id,
      status,
      enrollment_date,
      completion_date,
      notes,
      created_at,
      updated_at,
      deleted_at,
      trial:trials!inner (
        id,
        title,
        description,
        research_partner_id,
        condition_id,
        treatment_id,
        status,
        phase,
        start_date,
        end_date,
        enrollment_target,
        current_enrollment,
        location,
        compensation,
        inclusion_criteria,
        exclusion_criteria,
        created_at,
        updated_at,
        deleted_at
      )
    `)
    .eq("patient_id", patientId)
    .eq("status", "approved")
    .single()

  if (error) {
    logger.error("Error fetching patient enrollment:", error)
    throw new Error("Failed to fetch patient enrollment")
  }

  return enrollment
}

// Update enrollment after data submission
export async function updateEnrollmentAfterSubmissionAction(enrollmentId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("trial_enrollments")
    .update({
      updated_at: new Date().toISOString(),
      notes: "Data submission completed"
    })
    .eq("id", enrollmentId)

  if (error) {
    logger.error("Error updating enrollment:", error)
    throw new Error("Failed to update enrollment")
  }
}

// Create initial enrollment request for a patient
export async function createInitialEnrollmentAction(trialId: string, patientId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("trial_enrollments")
    .insert({
      trial_id: trialId,
      patient_id: patientId,
      provider_id: "system", // TODO: Get actual provider ID
      status: "pending",
      enrollment_date: new Date().toISOString(),
      notes: "Initial enrollment request",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    logger.error("Error creating initial enrollment:", error)
    throw new Error("Failed to create enrollment")
  }

  return data
}

// Add action functions here later if needed 