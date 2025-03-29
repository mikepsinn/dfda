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

  const response = await supabase
    .from('patient_conditions_view')
    .select('*')
    .eq('patient_id', patientId)
    .order('diagnosed_at', { ascending: false })

  if (response.error) {
    logger.error('Error fetching patient conditions:', { error: response.error })
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