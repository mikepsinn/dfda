"use server"

import { createServerClient } from "@/lib/supabase"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"

export type TrialEnrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"]
export type TrialEnrollmentInsert = Database["public"]["Tables"]["trial_enrollments"]["Insert"]
export type TrialEnrollmentUpdate = Database["public"]["Tables"]["trial_enrollments"]["Update"]

export async function getTrialEnrollmentsAction(): Promise<TrialEnrollment[]> {
  const supabase = await createServerClient()
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
  const supabase = await createServerClient()
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
  const supabase = await createServerClient()
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
  const supabase = await createServerClient()
  const { data, error } = await supabase.from("trial_enrollments").insert(enrollment).select().single()

  if (error) {
    logger.error("Error creating trial enrollment:", error)
    throw error
  }

  return data
}

export async function updateTrialEnrollmentAction(id: string, updates: TrialEnrollmentUpdate) {
  const supabase = await createServerClient()
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
  const supabase = await createServerClient()
  const { error } = await supabase.from("trial_enrollments").delete().eq("id", id)

  if (error) {
    logger.error(`Error deleting trial enrollment with id ${id}:`, error)
    throw error
  }

  return true
}

export async function updateEnrollmentStatusAction(enrollmentId: string, status: TrialEnrollment['status']) {
  const supabase = await createServerClient()
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
  const supabase = await createServerClient()
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
  const supabase = await createServerClient()
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