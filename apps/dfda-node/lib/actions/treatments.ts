"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// Use the database types directly
export type Treatment = Database['public']['Tables']['global_treatments']['Row'] & {
  name: string
  description: string | null
}
export type TreatmentInsert = Database['public']['Tables']['global_treatments']['Insert']
export type TreatmentUpdate = Database['public']['Tables']['global_treatments']['Update']

// Get all treatments
export async function getTreatmentsAction(): Promise<Treatment[]> {
  const supabase = await createClient()

  const response = await supabase
    .from('global_treatments')
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
    .from('global_treatments')
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
    .from('global_treatments')
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
  const supabase = await createClient();
  logger.info('Fetching treatments associated with condition via ratings', { conditionId });

  // Revised Query: Start from patient_treatments, join treatments, then join ratings filtered by condition
  const response = await supabase
    .from('patient_treatments') // Start from patient_treatments
    .select(`
      treatment:treatments!inner (
        id,
        created_at,
        deleted_at,
        manufacturer,
        treatment_type,
        updated_at,
        active_ingredients,
        dosage_form,
        dosage_instructions,
        gv:global_variables!inner (
          name,
          description
        )
      ),
      treatment_ratings!inner(
         pc:patient_conditions!inner(condition_id)
      )
    `)
    // Filter based on the condition_id in the nested patient_conditions table
    .eq('treatment_ratings.pc.condition_id', conditionId)
    // Ensure the treatment itself is not deleted
    .not('treatment.deleted_at', 'is', null);
    // Ordering by effectiveness here can be complex and might duplicate treatments;
    // It's often better to get distinct treatments first, then fetch stats/ratings if needed.

  if (response.error) {
    logger.error('Error fetching treatments for condition:', { conditionId, error: response.error });
    // Log the specific Supabase error details for better debugging
    console.error("Supabase Error Details:", JSON.stringify(response.error, null, 2));
    throw new Error('Failed to fetch treatments for condition');
  }

  if (!response.data) {
    return [];
  }

  // Extract unique treatments using a Map
  const treatmentsMap = new Map<string, Treatment>();
  response.data.forEach(item => {
    // Add type assertion to bypass incorrect type inference from complex join
    const typedItem = item as any; 

    // Check if treatment and its global_variable data exist and if the treatment hasn't been added yet
    // Use typedItem now
    if (typedItem.treatment && typedItem.treatment.gv && !treatmentsMap.has(typedItem.treatment.id)) {
      treatmentsMap.set(typedItem.treatment.id, {
        // Spread the fields from typedItem.treatment
        id: typedItem.treatment.id,
        created_at: typedItem.treatment.created_at,
        deleted_at: typedItem.treatment.deleted_at,
        manufacturer: typedItem.treatment.manufacturer,
        treatment_type: typedItem.treatment.treatment_type,
        updated_at: typedItem.treatment.updated_at,
        active_ingredients: typedItem.treatment.active_ingredients,
        dosage_form: typedItem.treatment.dosage_form,
        dosage_instructions: typedItem.treatment.dosage_instructions,
        // Add the fields from the joined global_variables
        name: typedItem.treatment.gv.name,
        description: typedItem.treatment.gv.description
      });
    }
  });

  const uniqueTreatments = Array.from(treatmentsMap.values());
  logger.info(`Found ${uniqueTreatments.length} unique treatments for condition`, { conditionId });

  return uniqueTreatments;
}

// Create a new treatment
export async function createTreatmentAction(treatment: TreatmentInsert): Promise<Treatment> {
  const supabase = await createClient()

  const response = await supabase
    .from('global_treatments')
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
    .from('global_treatments')
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
    .from('global_treatments')
    .delete()
    .eq('id', id)

  if (response.error) {
    logger.error('Error deleting treatment:', { error: response.error })
    throw new Error('Failed to delete treatment')
  }

  revalidatePath('/treatments')
}
