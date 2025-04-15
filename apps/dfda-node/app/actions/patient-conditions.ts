"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

export type PatientCondition = Database['public']['Views']['patient_conditions_view']['Row']
export type PatientConditionInsert = Database['public']['Tables']['patient_conditions']['Insert']
export type PatientConditionUpdate = Database['public']['Tables']['patient_conditions']['Update']

// Get all conditions for a patient
export async function getPatientConditionsAction(patientId: string): Promise<PatientCondition[]> {
  const supabase = await createClient()

  // Log the request details
  logger.info('Fetching patient conditions:', {
    table: 'patient_conditions_view',
    patientId,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  const response = await supabase
    .from('patient_conditions_view')
    .select('*')
    .eq('patient_id', patientId)
    .order('diagnosed_at', { ascending: false })

  if (response.error) {
    logger.error('Error fetching patient conditions:', { 
      error: response.error,
      status: response.status,
      statusText: response.statusText
    })
    throw new Error('Failed to fetch patient conditions')
  }

  return response.data
}

// Get a specific condition by ID
export async function getPatientConditionByIdAction(id: string): Promise<PatientCondition | null> {
  const supabase = await createClient()

  const response = await supabase
    .from('patient_conditions_view')
    .select('*')
    .eq('id', id)
    .single()

  if (response.error) {
    logger.error('Error fetching patient condition:', { error: response.error })
    throw new Error('Failed to fetch patient condition')
  }

  return response.data
}

// Create a new condition for a patient
export async function createPatientConditionAction(condition: PatientConditionInsert): Promise<PatientCondition> {
  const supabase = await createClient()

  // First create the condition
  const insertResponse = await supabase
    .from('patient_conditions')
    .insert(condition)
    .select()
    .single()

  if (insertResponse.error) {
    logger.error('Error creating patient condition:', { error: insertResponse.error })
    throw new Error('Failed to create patient condition')
  }

  // Then fetch it from the view to get the complete data
  const viewResponse = await supabase
    .from('patient_conditions_view')
    .select('*')
    .eq('id', insertResponse.data.id)
    .single()

  if (viewResponse.error) {
    logger.error('Error fetching created patient condition:', { error: viewResponse.error })
    throw new Error('Failed to fetch created patient condition')
  }

  revalidatePath(`/patient/${condition.patient_id}`)
  return viewResponse.data
}

// Update a patient condition
export async function updatePatientConditionAction(id: string, updates: PatientConditionUpdate): Promise<PatientCondition> {
  const supabase = await createClient()

  // First update the condition
  const updateResponse = await supabase
    .from('patient_conditions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (updateResponse.error) {
    logger.error('Error updating patient condition:', { error: updateResponse.error })
    throw new Error('Failed to update patient condition')
  }

  // Then fetch it from the view to get the complete data
  const viewResponse = await supabase
    .from('patient_conditions_view')
    .select('*')
    .eq('id', id)
    .single()

  if (viewResponse.error) {
    logger.error('Error fetching updated patient condition:', { error: viewResponse.error })
    throw new Error('Failed to fetch updated patient condition')
  }

  revalidatePath(`/patient/${updateResponse.data.patient_id}`)
  return viewResponse.data
}

// Delete a patient condition
export async function deletePatientConditionAction(id: string): Promise<void> {
  const supabase = await createClient()

  const response = await supabase
    .from('patient_conditions')
    .delete()
    .eq('id', id)

  if (response.error) {
    logger.error('Error deleting patient condition:', { error: response.error })
    throw new Error('Failed to delete patient condition')
  }

  revalidatePath('/conditions')
}

// Action for bulk-adding conditions during onboarding
export async function addInitialPatientConditionsAction(
  patientId: string, 
  conditions: { id: string; name: string }[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  logger.info('Adding initial patient conditions', { patientId, count: conditions.length });

  if (!patientId || !conditions || conditions.length === 0) {
    logger.warn('Attempted to add initial conditions with invalid input', { patientId, conditions });
    return { success: false, error: 'Invalid input provided.' };
  }

  const conditionsToInsert: PatientConditionInsert[] = conditions.map(c => ({
    patient_id: patientId,
    condition_id: c.id, // This is the global condition ID
    // You might want default values or nulls here depending on your table definition
    status: 'active', // Default status
    diagnosed_at: new Date().toISOString(), // Default diagnosed date
  }));

  const { error } = await supabase
    .from('patient_conditions')
    .insert(conditionsToInsert);

  if (error) {
    logger.error('Error inserting initial patient conditions:', { 
      patientId, 
      conditionIds: conditions.map(c => c.id),
      error 
    });
    return { success: false, error: 'Failed to save conditions.' };
  }

  // Revalidate relevant paths after successful insertion
  try {
    revalidatePath(`/patient/${patientId}`); // Revalidate the main patient dashboard
    revalidatePath(`/patient/conditions`); // Revalidate the conditions list page
  } catch (revalError) {
    logger.error('Error during revalidation after initial condition add', { revalError, patientId });
    // Don't fail the whole operation for a revalidation error
  }

  logger.info('Successfully added initial patient conditions', { patientId, count: conditions.length });
  return { success: true };
} 