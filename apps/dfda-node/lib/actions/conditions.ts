"use server"

import { createClient } from '@/utils/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
// Remove VARIABLE_CATEGORIES import if no longer needed elsewhere
// import { VARIABLE_CATEGORIES } from '@/lib/constants/variable-categories'

// Use Tables helper for specific types
import { Tables } from '@/lib/database.types';

// Combined type for Condition including name/description from global_variables
type Condition = Pick<Tables<'global_conditions'>, 'id' | 'created_at' | 'deleted_at' | 'updated_at'> & 
                 Pick<Tables<'global_variables'>, 'name' | 'description'>;

// Use the database view type directly 
export type ConditionView = Database['public']['Views']['patient_conditions_view']['Row']
export type PatientConditionRow = ConditionView; // Alias for clarity in component
export type ConditionInsert = Database['public']['Tables']['global_conditions']['Insert']
export type ConditionUpdate = Database['public']['Tables']['global_conditions']['Update']

// Get all conditions present in the conditions table
export async function getConditionsAction() {
  const supabase = await createClient()

  const response = await supabase
    .from('global_conditions')
    .select(`
      id,
      global_variables!inner(
        name,
        description,
        emoji
      )
    `)
    .order('id')
    .limit(50)

  if (response.error) {
    logger.error('Error fetching conditions:', { error: response.error })
    throw new Error('Failed to fetch conditions')
  }

  // Map the response to flatten the structure
  return response.data.map(item => ({
    id: item.id,
    name: item.global_variables.name,
    description: item.global_variables.description,
    emoji: item.global_variables.emoji
  }));
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
      .from('global_conditions')
      .select(`
        id,
        global_variables!inner(
          name,
          description,
          emoji
        )
      `)
      .ilike('global_variables.name', name) // Case-insensitive match for the name
      .maybeSingle(); // Use maybeSingle() in case name isn't found

    if (error) {
      logger.error('Error fetching condition by name:', { error });
      throw error;
    }

    if (!condition) {
      logger.warn('Condition not found by name:', { name });
      return null;
    }

    // Map the response to flatten the structure
    const result = {
      id: condition.id,
      name: condition.global_variables.name,
      description: condition.global_variables.description,
      emoji: condition.global_variables.emoji
    };

    logger.info('Found condition by name:', { condition: result });
    return result;
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
      .from('global_conditions')
      .select(`
        id,
        global_variables!inner(
          name,
          description,
          emoji
        )
      `)
      .ilike('global_variables.name', `%${query}%`)
      .order('id')

    if (error) {
      logger.error('Error searching conditions:', { error })
      throw error
    }

    // Map the response to flatten the structure
    const results = (conditions || []).map(item => ({
      id: item.id,
      name: item.global_variables.name,
      description: item.global_variables.description,
      emoji: item.global_variables.emoji
    }));

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

  const response = await supabase.from("global_conditions").insert(condition).select().single()

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
    .from("global_conditions")
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

  const response = await supabase.from("global_conditions").delete().eq("id", id)

  if (response.error) {
    logger.error('Error deleting condition:', { error: response.error })
    throw new Error('Failed to delete condition')
  }

  revalidatePath('/conditions')
}

// Gets conditions associated with a specific user from the view
// Returns data matching the PatientConditionRow type (aliased from ConditionView)
export async function getConditionsByUserAction(userId: string): Promise<PatientConditionRow[]> {
  const supabase = await createClient()
  logger.info("Fetching user conditions view for user", { userId })

  // Fetch patient conditions directly from the view
  const response = await supabase
    .from('patient_conditions_view') // Use the view directly
    .select('*') // Select all columns from the view
    .eq('patient_id', userId)
    // Removed filter on deleted_at as it does not exist in the current view definition
    .order('condition_name', { ascending: true }); // Order by condition name

  if (response.error) {
    logger.error("Error fetching user conditions view", { userId, error: response.error })
    throw new Error("Failed to fetch user conditions")
  }

  // The data from the view should directly match PatientConditionRow[]
  return response.data || [];
}

/**
 * Gets conditions associated with a specific treatment.
 * This might involve looking at patient_treatments and patient_conditions
 * to see which conditions patients using this treatment also have.
 * 
 * Alternative: If treatments are directly linked to conditions they treat,
 * the query would be simpler.
 * 
 * Current Approach: Find patients using the treatment, then find their conditions.
 * 
 * @param treatmentId The ID of the treatment.
 * @returns A promise resolving to an array of Condition objects.
 */
export async function getConditionsForTreatmentAction(treatmentId: string): Promise<Condition[]> {
  const supabase = await createClient()
  logger.info("Fetching conditions associated with treatment", { treatmentId })

  // 1. Find patient_ids using the treatment
  const patientResponse = await supabase
    .from('patient_treatments')
    .select('patient_id')
    .eq('treatment_id', treatmentId)
    .not('deleted_at', 'is', null);

  if (patientResponse.error) {
    logger.error('Error fetching patients for treatment:', { treatmentId, error: patientResponse.error });
    throw new Error('Failed to fetch patients for treatment');
  }

  const patientIds = patientResponse.data?.map(pt => pt.patient_id) || [];

  if (patientIds.length === 0) {
    logger.info('No patients found for treatment, thus no associated conditions', { treatmentId });
    return [];
  }

  // 2. Find conditions associated with these patient_ids
  const conditionResponse = await supabase
    .from('patient_conditions')
    .select(`
      condition:conditions!inner(
        id,
        created_at,
        deleted_at,
        updated_at,
        gv:global_variables!inner(
          name,
          description
        )
      )
    `)
    .in('patient_id', patientIds)
    .not('deleted_at', 'is', null)
    .not('condition.deleted_at', 'is', null); // Ensure condition itself isn't deleted

  if (conditionResponse.error) {
    logger.error('Error fetching conditions for patients:', { treatmentId, patientIds, error: conditionResponse.error });
    throw new Error('Failed to fetch conditions for treatment');
  }

  if (!conditionResponse.data) {
    return [];
  }

  // 3. Extract unique conditions
  const conditionsMap = new Map<string, Condition>();
  conditionResponse.data.forEach(item => {
    // Type assertion for clarity
    const typedItem = item as any;
    if (typedItem.condition && typedItem.condition.gv && !conditionsMap.has(typedItem.condition.id)) {
      conditionsMap.set(typedItem.condition.id, {
        id: typedItem.condition.id,
        created_at: typedItem.condition.created_at,
        deleted_at: typedItem.condition.deleted_at,
        updated_at: typedItem.condition.updated_at,
        name: typedItem.condition.gv.name,
        description: typedItem.condition.gv.description
      });
    }
  });

  // const conditions = Array.from(conditionsMap.values());
  // logger.info(`Found ${conditions.length} unique conditions associated with treatment`, { treatmentId });

  return Array.from(conditionsMap.values()) // Directly return the array
}
