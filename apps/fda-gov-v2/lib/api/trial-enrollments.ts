import { createServerSupabaseClient } from "../supabase"
import type { Database } from "../database.types"

export type TrialEnrollment = Database["public"]["Tables"]["trial_enrollments"]["Row"]
export type TrialEnrollmentInsert = Database["public"]["Tables"]["trial_enrollments"]["Insert"]
export type TrialEnrollmentUpdate = Database["public"]["Tables"]["trial_enrollments"]["Update"]

export async function getTrialEnrollmentsByPatient(patientId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("trial_enrollments")
    .select(`
      *,
      trials:trial_id(
        id, 
        name, 
        description, 
        status,
        treatments:treatment_id(id, name),
        conditions:condition_id(id, name)
      )
    `)
    .eq("patient_id", patientId)
    .order("enrollment_date", { ascending: false })

  if (error) {
    console.error(`Error fetching trial enrollments for patient ${patientId}:`, error)
    throw error
  }

  return data
}

export async function getTrialEnrollmentsByTrial(trialId: string) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("trial_enrollments")
    .select(`
      *,
      patients:patient_id(id, name, email)
    `)
    .eq("trial_id", trialId)
    .order("enrollment_date", { ascending: false })

  if (error) {
    console.error(`Error fetching trial enrollments for trial ${trialId}:`, error)
    throw error
  }

  return data
}

export async function createTrialEnrollment(enrollment: TrialEnrollmentInsert) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase.from("trial_enrollments").insert(enrollment).select().single()

  if (error) {
    console.error("Error creating trial enrollment:", error)
    throw error
  }

  // Update the enrolled_participants count in the trial
  const { error: updateError } = await supabase.rpc("increment_trial_participants", {
    trial_id: enrollment.trial_id,
  })

  if (updateError) {
    console.error("Error updating trial participants count:", updateError)
  }

  return data
}

export async function updateTrialEnrollment(id: string, updates: TrialEnrollmentUpdate) {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("trial_enrollments")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating trial enrollment with id ${id}:`, error)
    throw error
  }

  return data
}

export async function deleteTrialEnrollment(id: string) {
  const supabase = createServerSupabaseClient()

  // First get the enrollment to get the trial_id
  const { data: enrollment, error: fetchError } = await supabase
    .from("trial_enrollments")
    .select("trial_id")
    .eq("id", id)
    .single()

  if (fetchError) {
    console.error(`Error fetching trial enrollment with id ${id}:`, fetchError)
    throw fetchError
  }

  // Delete the enrollment
  const { error } = await supabase.from("trial_enrollments").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting trial enrollment with id ${id}:`, error)
    throw error
  }

  // Update the enrolled_participants count in the trial
  const { error: updateError } = await supabase.rpc("decrement_trial_participants", {
    trial_id: enrollment.trial_id,
  })

  if (updateError) {
    console.error("Error updating trial participants count:", updateError)
  }

  return true
}

export async function updateEnrollmentStatus(enrollmentId: string, status: TrialEnrollment['status']) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('trial_enrollments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', enrollmentId)
    .select()
    .single();

  if (error) {
    console.error(`Error updating enrollment status for ${enrollmentId}:`, error);
    throw error;
  }

  return data;
}

export async function deleteEnrollment(enrollmentId: string) {
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from('trial_enrollments')
    .delete()
    .eq('id', enrollmentId);

  if (error) {
    console.error(`Error deleting enrollment ${enrollmentId}:`, error);
    throw error;
  }

  return true;
}
