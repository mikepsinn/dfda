"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// Use the database types directly
export type Treatment = Database['public']['Tables']['treatments']['Row'] & {
  name: string
  description: string | null
}
export type TreatmentInsert = Database['public']['Tables']['treatments']['Insert']
export type TreatmentUpdate = Database['public']['Tables']['treatments']['Update']

// Get all treatments
export async function getTreatmentsAction(): Promise<Treatment[]> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatments')
    .select(`
      *,
      global_variables!inner (
        name,
        description
      )
    `)
    .order('name')
    .limit(50)

  if (response.error) {
    logger.error('Error fetching treatments:', { error: response.error })
    throw new Error('Failed to fetch treatments')
  }

  return response.data.map(treatment => ({
    ...treatment,
    name: treatment.global_variables.name,
    description: treatment.global_variables.description
  }))
}

// Get a treatment by ID
export async function getTreatmentByIdAction(id: string): Promise<Treatment | null> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatments')
    .select(`
      *,
      global_variables!inner (
        name,
        description
      )
    `)
    .eq('id', id)
    .single()

  if (response.error) {
    logger.error('Error fetching treatment:', { error: response.error })
    throw new Error('Failed to fetch treatment')
  }

  const treatment = response.data
  return {
    ...treatment,
    name: treatment.global_variables.name,
    description: treatment.global_variables.description
  }
}

// Search treatments by name
export async function searchTreatmentsAction(query: string): Promise<Treatment[]> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatments')
    .select(`
      *,
      global_variables!inner (
        name,
        description
      )
    `)
    .textSearch('global_variables.name', query)
    .limit(10)

  if (response.error) {
    logger.error('Error searching treatments:', { error: response.error })
    throw new Error('Failed to search treatments')
  }

  return response.data.map(treatment => ({
    ...treatment,
    name: treatment.global_variables.name,
    description: treatment.global_variables.description
  }))
}

// Get treatments for a specific condition
export async function getTreatmentsForConditionAction(conditionId: string): Promise<Treatment[]> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatments')
    .select(`
      *,
      global_variables!inner (
        name,
        description
      ),
      treatment_ratings!inner (
        effectiveness_out_of_ten
      )
    `)
    .eq('treatment_ratings.condition_id', conditionId)
    .not('deleted_at', 'is', null)
    .order('treatment_ratings.effectiveness_out_of_ten', { ascending: false })

  if (response.error) {
    logger.error('Error fetching treatments for condition:', { error: response.error })
    throw new Error('Failed to fetch treatments for condition')
  }

  return response.data.map(treatment => ({
    ...treatment,
    name: treatment.global_variables.name,
    description: treatment.global_variables.description
  }))
}

// Create a new treatment
export async function createTreatmentAction(treatment: TreatmentInsert): Promise<Treatment> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatments')
    .insert(treatment)
    .select(`
      *,
      global_variables!inner (
        name,
        description
      )
    `)
    .single()

  if (response.error) {
    logger.error('Error creating treatment:', { error: response.error })
    throw new Error('Failed to create treatment')
  }

  revalidatePath('/treatments')
  
  const newTreatment = response.data
  return {
    ...newTreatment,
    name: newTreatment.global_variables.name,
    description: newTreatment.global_variables.description
  }
}

// Update a treatment
export async function updateTreatmentAction(id: string, updates: TreatmentUpdate): Promise<Treatment> {
  const supabase = await createClient()

  const response = await supabase
    .from('treatments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      global_variables!inner (
        name,
        description
      )
    `)
    .single()

  if (response.error) {
    logger.error('Error updating treatment:', { error: response.error })
    throw new Error('Failed to update treatment')
  }

  revalidatePath(`/treatment/${id}`)
  revalidatePath('/treatments')
  
  const updatedTreatment = response.data
  return {
    ...updatedTreatment,
    name: updatedTreatment.global_variables.name,
    description: updatedTreatment.global_variables.description
  }
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
