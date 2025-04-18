"use server"

import { createClient } from '@/lib/supabase/server'
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

// Specific type for the result of getConditionsByUserAction
type UserCondition = {
  patient_condition_id: string;
  user_id: string;
  condition_id: string | null;
  condition_name: string;
  condition_description: string | null;
  added_at: string | null;
};

// Use the database view type directly 
export type ConditionView = Database['public']['Views']['patient_conditions_view']['Row']
export type ConditionInsert = Database['public']['Tables']['global_conditions']['Insert']
export type ConditionUpdate = Database['public']['Tables']['global_conditions']['Update']

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
  return response.data.map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    emoji: item.emoji
    // Explicitly map fields, ignore 'conditions' join artifact
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
    // const { conditions, ...globalVarData } = condition; // Commented out unused variable
    const globalVarData = { ...condition }; // Keep data without destructuring
    delete (globalVarData as any).conditions; // Remove the join artifact if needed
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
    const results = (conditions || []).map(item => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { conditions: _ignored, ...globalVarData } = item; // Destructure inside map, explicitly ignore conditions
      return globalVarData;
    });
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

export async function getConditionsByUserAction(userId: string): Promise<UserCondition[]> {
  const supabase = await createClient()
  logger.info("Fetching conditions for user", { userId })
  // Query patient_conditions, join conditions, then global_variables for name
  const response = await supabase
    .from("patient_conditions")
    .select(`
      *,
      condition:conditions!inner(
        id,
        global_variables!inner(
          name,
          description
        )
      )
    `)
    .eq("patient_id", userId)
    .not("deleted_at", "is", null)

  if (response.error) {
    logger.error("Error fetching user conditions:", { userId, error: response.error })
    throw new Error("Failed to fetch user conditions")
  }

  if (!response.data) {
    return []
  }

  // Map the response to the expected UserCondition format
  const userConditions = response.data.map(pc => {
    // Type assertion for clarity, adjust based on exact generated types if needed
    const typedPc = pc as any;
    // Safely access nested properties
    const conditionData = typedPc.condition;
    const gvData = conditionData?.global_variables;

    return {
      patient_condition_id: typedPc.id, // Map from patient_conditions table
      user_id: typedPc.patient_id,
      condition_id: conditionData?.id ?? null, // From nested condition
      condition_name: gvData?.name ?? 'Unknown Condition',
      condition_description: gvData?.description ?? null,
      added_at: typedPc.created_at // Or updated_at if preferred
    };
  });

  return userConditions;
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
