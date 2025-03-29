"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// Use the database view type directly
export type Treatment = Database['public']['Views']['patient_treatments_view']['Row']
export type TreatmentInsert = Database['public']['Tables']['treatments']['Insert']
export type TreatmentUpdate = Database['public']['Tables']['treatments']['Update']

// Get all treatments from the view
export async function getTreatmentsAction(): Promise<Treatment[]> {
  const supabase = await createClient()

  const response = await supabase
    .from('patient_treatments_view')
    .select('*')
    .order('treatment_name')
    .limit(50)

  if (response.error) {
    logger.error('Error fetching treatments:', { error: response.error })
    throw new Error('Failed to fetch treatments')
  }

  return response.data
}

// Get a treatment by ID from the view
export async function getTreatmentByIdAction(id: string): Promise<Treatment | null> {
  const supabase = await createClient()

  const response = await supabase
    .from('patient_treatments_view')
    .select('*')
    .eq('treatment_id', id)
    .maybeSingle()

  if (response.error) {
    logger.error('Error fetching treatment:', { error: response.error })
    throw new Error('Failed to fetch treatment')
  }

  return response.data
}

// Search treatments by name
export async function searchTreatmentsAction(query: string): Promise<Treatment[]> {
  const supabase = await createClient()

  const response = await supabase
    .from('patient_treatments_view')
    .select('*')
    .ilike('treatment_name', `%${query}%`)
    .order('treatment_name')
    .limit(10)

  if (response.error) {
    logger.error('Error searching treatments:', { error: response.error })
    throw new Error('Failed to search treatments')
  }

  return response.data
}

// Get treatments for a specific condition
export async function getTreatmentsForConditionAction(conditionId: string): Promise<Treatment[]> {
  const supabase = await createClient()

  const response = await supabase
    .from('patient_treatments_view')
    .select('*')
    .eq('condition_id', conditionId)
    .order('effectiveness_out_of_ten', { ascending: false })

  if (response.error) {
    logger.error('Error fetching treatments for condition:', { error: response.error })
    throw new Error('Failed to fetch treatments for condition')
  }

  return response.data
}

// Create a new treatment
export async function createTreatmentAction(treatment: TreatmentInsert): Promise<Treatment> {
  const supabase = await createClient()

  // First create the treatment
  const insertResponse = await supabase
    .from('treatments')
    .insert(treatment)
    .select()
    .single()

  if (insertResponse.error) {
    logger.error('Error creating treatment:', { error: insertResponse.error })
    throw new Error('Failed to create treatment')
  }

  // Then fetch it from the view to get the complete data
  const viewResponse = await supabase
    .from('patient_treatments_view')
    .select('*')
    .eq('treatment_id', insertResponse.data.id)
    .single()

  if (viewResponse.error) {
    logger.error('Error fetching created treatment:', { error: viewResponse.error })
    throw new Error('Failed to fetch created treatment')
  }

  revalidatePath('/treatments')
  return viewResponse.data
}

// Update a treatment
export async function updateTreatmentAction(id: string, updates: TreatmentUpdate): Promise<Treatment> {
  const supabase = await createClient()

  // First update the treatment
  const updateResponse = await supabase
    .from('treatments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (updateResponse.error) {
    logger.error('Error updating treatment:', { error: updateResponse.error })
    throw new Error('Failed to update treatment')
  }

  // Then fetch it from the view to get the complete data
  const viewResponse = await supabase
    .from('patient_treatments_view')
    .select('*')
    .eq('treatment_id', id)
    .single()

  if (viewResponse.error) {
    logger.error('Error fetching updated treatment:', { error: viewResponse.error })
    throw new Error('Failed to fetch updated treatment')
  }

  revalidatePath(`/treatment/${id}`)
  revalidatePath('/treatments')
  return viewResponse.data
}

// Delete a treatment
export async function deleteTreatmentAction(id: string): Promise<void> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatments')
    .delete()
    .eq('id', id)

  if (response.error) {
    logger.error('Error deleting treatment:', { error: response.error })
    throw new Error('Failed to delete treatment')
  }

  revalidatePath('/treatments')
}
