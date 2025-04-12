"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
// Remove VARIABLE_CATEGORIES import if no longer needed elsewhere
// import { VARIABLE_CATEGORIES } from '@/lib/constants/variable-categories'

// Use the database view type directly 
export type ConditionView = Database['public']['Views']['patient_conditions_view']['Row']
export type ConditionInsert = Database['public']['Tables']['conditions']['Insert']
export type ConditionUpdate = Database['public']['Tables']['conditions']['Update']

// Get all conditions present in the conditions table
export async function getConditionsAction() {
  const supabase = await createClient()

  const response = await supabase
    .from('global_variables')
    .select(`
      id,
      name,
      description,
      emoji,
      conditions!inner(*)
    `)
    .order('name')
    .limit(50)

  if (response.error) {
    logger.error('Error fetching conditions:', { error: response.error })
    throw new Error('Failed to fetch conditions')
  }

  // Filter out the join artifacts if needed, or adjust select
  // The data structure might change slightly due to the join.
  // Assuming the goal is to return the global_variables data for matched conditions.
  return response.data.map(({ conditions, ...globalVarData }) => globalVarData);
}

// Get a condition by ID with joined name from global_variables
// This function already seems okay as it uses patient_conditions_view
// which likely already joins conditions and global_variables.
export async function getConditionByIdAction(id: string): Promise<ConditionView | null> {
  const supabase = await createClient()

  const response = await supabase
    .from('patient_conditions_view')
    .select()
    .eq('id', id)
    .single()

  if (response.error) {
    logger.error('Error fetching condition:', { error: response.error })
    throw new Error('Failed to fetch condition')
  }

  return response.data
}

// Get a condition by name/slug, ensuring it exists in the conditions table
export async function getConditionByNameAction(name: string) {
  const supabase = await createClient();
  logger.info('Fetching condition by name:', { name });

  try {
    const { data: condition, error } = await supabase
      .from('global_variables')
      .select(`
        id,
        name,
        description,
        emoji,
        conditions!inner(*)
      `)
      .ilike('name', name) // Case-insensitive match for the name
      .maybeSingle(); // Use maybeSingle() in case name isn't found

    if (error) {
      logger.error('Error fetching condition by name:', { error });
      throw error;
    }

    if (!condition) {
       logger.warn('Condition not found by name or not in conditions table:', { name });
       return null;
    }

    // Destructure to remove the join artifact
    const { conditions, ...globalVarData } = condition;
    logger.info('Found condition by name:', { condition: globalVarData });
    return globalVarData;
  } catch (error) {
    logger.error('Error in getConditionByNameAction:', { error });
    throw new Error(`Failed to fetch condition by name: ${name}`);
  }
}

// Search conditions by name, ensuring they exist in the conditions table
export async function searchConditionsAction(query: string) {
  const supabase = await createClient()
  logger.info('Searching conditions with query:', { query })

  try {
    const { data: conditions, error } = await supabase
      .from('global_variables')
      .select(`
        id,
        name,
        description,
        emoji,
        conditions!inner(*)
      `)
      .ilike('name', `%${query}%`)
      .order('name')

    if (error) {
      logger.error('Error searching conditions:', { error })
      throw error
    }

    // Map to remove join artifacts
    const results = (conditions || []).map(({ conditions, ...globalVarData }) => globalVarData);
    logger.info('Found conditions:', { count: results.length });
    return results;
  } catch (error) {
    logger.error('Error in searchConditionsAction:', { error })
    throw error
  }
}

// Create a new condition
export async function createConditionAction(condition: ConditionInsert) {
  const supabase = await createClient()

  const response = await supabase.from("conditions").insert(condition).select().single()

  if (response.error) {
    logger.error('Error creating condition:', { error: response.error })
    throw new Error('Failed to create condition')
  }

  revalidatePath('/conditions')
  return response.data
}

// Update a condition
export async function updateConditionAction(id: string, updates: ConditionUpdate) {
  const supabase = await createClient()

  const response = await supabase
    .from("conditions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single()

  if (response.error) {
    logger.error('Error updating condition:', { error: response.error })
    throw new Error('Failed to update condition')
  }

  revalidatePath(`/condition/${id}`)
  revalidatePath('/conditions')
  return response.data
}

// Delete a condition
export async function deleteConditionAction(id: string) {
  const supabase = await createClient()

  const response = await supabase.from("conditions").delete().eq("id", id)

  if (response.error) {
    logger.error('Error deleting condition:', { error: response.error })
    throw new Error('Failed to delete condition')
  }

  revalidatePath('/conditions')
}
