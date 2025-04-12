"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { handleDatabaseResponse, handleDatabaseCollectionResponse } from '@/lib/actions-helpers'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export type ReportedSideEffect = Database['public']['Tables']['reported_side_effects']['Row']
export type ReportedSideEffectInsert = Database['public']['Tables']['reported_side_effects']['Insert']
export type ReportedSideEffectUpdate = Database['public']['Tables']['reported_side_effects']['Update']

// Get individual side effect reports for a specific patient_treatment record
export async function getSideEffectReportsForPatientTreatmentAction(
  patientTreatmentId: string, 
  limit = 10
): Promise<ReportedSideEffect[]> {
  const supabase = await createClient()
  logger.info('Fetching side effect reports for patient treatment', { patientTreatmentId });

  const response = await supabase
    .from('reported_side_effects')
    .select(` 
      id,
      description,
      severity_out_of_ten,
      created_at
      // Note: Cannot easily join profile info here without user_id
      // If profile info is needed, fetch patient_id from patient_treatments first
    `)
    .eq('patient_treatment_id', patientTreatmentId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (response.error) {
    logger.error('Error fetching side effect reports:', { patientTreatmentId, error: response.error })
    throw new Error('Failed to fetch side effect reports')
  }

  // Use handleDatabaseCollectionResponse if available and appropriate
  // return handleDatabaseCollectionResponse(response)
  return response.data || [] 
}

// Report a side effect for a specific patient_treatment record
export async function reportSideEffectAction(
  sideEffect: Omit<ReportedSideEffectInsert, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> // Action receives data needed for insert
): Promise<ReportedSideEffect> {
  const supabase = await createClient()
  logger.info('Reporting side effect', { patientTreatmentId: sideEffect.patient_treatment_id });

  // Ensure required fields are present
  if (!sideEffect.patient_treatment_id || !sideEffect.description) {
      const errorMsg = 'Patient treatment ID and description are required to report a side effect.';
      logger.error(errorMsg, { sideEffect });
      throw new Error(errorMsg);
  }

  const response = await supabase
    .from('reported_side_effects')
    .insert({
        patient_treatment_id: sideEffect.patient_treatment_id,
        description: sideEffect.description,
        severity_out_of_ten: sideEffect.severity_out_of_ten ?? null // Handle potential null severity
    })
    .select() // Select the newly inserted row
    .single()

  if (response.error) {
    logger.error('Error reporting side effect:', { error: response.error, patientTreatmentId: sideEffect.patient_treatment_id })
    throw new Error('Failed to report side effect')
  }

  // Revalidate based on patient_treatment_id (find the related treatment/patient paths)
  // This requires fetching the patient_treatment record to get treatment_id/patient_id
  // For simplicity now, revalidate the general treatments page
  // TODO: Implement more specific revalidation
  try {
    const { data: pt } = await supabase
      .from('patient_treatments')
      .select('patient_id, treatment_id')
      .eq('id', sideEffect.patient_treatment_id)
      .single();
    
    if (pt) {
      revalidatePath(`/patient/treatments`); // General page
      // revalidatePath(`/treatment/${pt.treatment_id}`); // If such a page exists
      // revalidatePath(`/patient/${pt.patient_id}/details`); // If such a page exists
    }
  } catch (revalError) {
      logger.warn('Failed to get patient_treatment details for revalidation', { patientTreatmentId: sideEffect.patient_treatment_id, revalError });
      revalidatePath(`/patient/treatments`); // Fallback revalidation
  }

  return handleDatabaseResponse<ReportedSideEffect>(response)
}

// Update a side effect report (Payload should include patient_treatment_id if it can be changed? Unlikely)
export async function updateSideEffectReportAction(
  id: string,
  updates: Omit<ReportedSideEffectUpdate, 'patient_treatment_id' | 'id' | 'created_at' | 'updated_at'>
): Promise<ReportedSideEffect> {
  const supabase = await createClient()
  logger.info('Updating side effect report', { reportId: id });

  const response = await supabase
    .from('reported_side_effects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (response.error) {
    logger.error('Error updating side effect report:', { error: response.error, reportId: id })
    throw new Error('Failed to update side effect report')
  }

  // Revalidation needs the patient_treatment_id
  const report = response.data // Use the returned data which should have the ID
  if (report?.patient_treatment_id) {
     // TODO: Implement more specific revalidation similar to create action
     revalidatePath(`/patient/treatments`); 
  }

  return handleDatabaseResponse<ReportedSideEffect>(response)
}

// Delete a side effect report
export async function deleteSideEffectReportAction(id: string): Promise<void> {
  const supabase = await createClient()
  logger.warn('Deleting side effect report', { reportId: id });

  // Get the report before deleting to revalidate
  const report = await getSideEffectReportByIdAction(id)

  const response = await supabase
    .from('reported_side_effects')
    .delete()
    .eq('id', id)

  if (response.error) {
    logger.error('Error deleting side effect report:', { error: response.error, reportId: id })
    throw new Error('Failed to delete side effect report')
  }

  // Revalidation needs the patient_treatment_id
  if (report?.patient_treatment_id) {
    // TODO: Implement more specific revalidation similar to create action
    revalidatePath(`/patient/treatments`); 
  }
}

// Get a side effect report by ID (remains the same)
export async function getSideEffectReportByIdAction(id: string): Promise<ReportedSideEffect | null> {
  const supabase = await createClient()
  logger.info('Fetching side effect report by ID', { reportId: id });

  const response = await supabase
    .from('reported_side_effects')
    .select('*') // Select all fields including patient_treatment_id
    .eq('id', id)
    .single()

  // Handle not found error gracefully
  if (response.error && response.error.code === 'PGRST116') {
    return null; 
  }
  if (response.error) {
    logger.error('Error fetching side effect report:', { error: response.error, reportId: id })
    throw new Error('Failed to fetch side effect report')
  }

  return handleDatabaseResponse<ReportedSideEffect>(response)
} 