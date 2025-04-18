"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { logger } from '@/lib/logger'
import { VARIABLE_CATEGORY_IDS } from "@/lib/constants/variable-categories"; // Import the constants

// Represents a row from the global_variables table
export type GlobalVariable = Database['public']['Tables']['global_variables']['Row']

/**
 * Fetches details for a specific global variable by its ID.
 * Note: This action does not check user ownership as global variables are public concepts.
 */
export async function getGlobalVariableByIdAction(globalVariableId: string): Promise<GlobalVariable | null> {
    const supabase = await createClient();
    logger.info("Fetching global variable by ID", { globalVariableId });

    if (!globalVariableId) {
        logger.warn("getGlobalVariableByIdAction called with no ID");
        return null;
    }

    const { data, error } = await supabase
        .from('global_variables')
        .select('*')
        .eq('id', globalVariableId)
        .maybeSingle();

    if (error) {
        logger.error("Error fetching global variable", { globalVariableId, error });
        // Don't throw, return null to allow the calling page to handle "not found"
        return null;
    }

    return data;
}

// TODO: Add other actions for global_variables if needed (search, list by category etc.)

// Define relevant predictor categories using constants
// Adjust these based on your actual variable_category IDs for things that have outcome labels
const PREDICTOR_CATEGORIES = [
    VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS,
    // Add other relevant category IDs using VARIABLE_CATEGORY_IDS.YOUR_CATEGORY
];

export type PredictorSuggestion = {
    id: string;
    name: string;
};

/**
 * Searches for global variables (potential predictors) by name within specific categories.
 */
export async function searchPredictorsAction(query: string): Promise<PredictorSuggestion[]> {
    const supabase = await createClient();
    logger.info("Searching predictors", { query });

    //if (!query || query.trim().length < 2) {return [];}

    const searchTerm = `%${query.trim()}%`;

    const { data, error } = await supabase
        .from('global_variables')
        .select('id, name')
        .in('variable_category_id', PREDICTOR_CATEGORIES)
        .ilike('name', searchTerm)
        .limit(10);

    if (error) {
        logger.error("Error searching predictors", { query, error });
        return []; // Don't throw, return empty array
    }

    return data || [];
}

// --- Actions to get variables by intervention type ---

// Renamed from TabVariable for better reusability
interface SimpleVariableInfo {
  id: string;
  name: string;
}

// Renamed and modified to fetch ONLY treatments
export async function getTreatmentVariables(limit: number = 9): Promise<SimpleVariableInfo[]> {
  const supabase = await createClient();
  let treatments: SimpleVariableInfo[] = [];

  try {
    // 1. Get IDs from treatments table
    const { data: treatmentIdsData, error: treatmentIdsError } = await supabase
      .from('global_treatments')
      .select('id')
      .limit(limit * 2); // Fetch more initially

    if (treatmentIdsError) {
      logger.error('Error fetching treatment IDs for tabs', { error: treatmentIdsError.message });
      return [];
    }

    const treatmentIds = treatmentIdsData?.map(t => t.id) || [];

    // 2. Fetch global_variables using the IDs
    if (treatmentIds.length > 0) {
      const { data: treatmentVars, error: treatmentsVarsError } = await supabase
        .from('global_variables')
        .select('id, name')
        .in('id', treatmentIds)
        .order('name')
        .limit(limit);

      if (treatmentsVarsError) {
        logger.error('Error fetching treatment variables for tabs', { error: treatmentsVarsError.message });
      } else {
        treatments = (treatmentVars as SimpleVariableInfo[] || []).filter(t => t.name); // Ensure name exists
      }
    }
  } catch (error) {
    logger.error('Unexpected error fetching treatment variables for tabs', { error });
  }

  return treatments;
}

// New action to fetch ONLY foods
export async function getFoodVariables(limit: number = 9): Promise<SimpleVariableInfo[]> {
  const supabase = await createClient();
  let foods: SimpleVariableInfo[] = [];

  try {
    // 1. Get IDs from global_foods table
    const { data: foodIdsData, error: foodIdsError } = await supabase
      .from('global_foods')
      .select('global_variable_id')
      .limit(limit * 2); // Fetch more initially

    if (foodIdsError) {
      logger.error('Error fetching food IDs for tabs', { error: foodIdsError.message });
      return [];
    }

    const foodIds = foodIdsData?.map(f => f.global_variable_id) || [];

    // 2. Fetch global_variables using the IDs
    if (foodIds.length > 0) {
      const { data: foodVars, error: foodsVarsError } = await supabase
        .from('global_variables')
        .select('id, name')
        .in('id', foodIds)
        .order('name')
        .limit(limit);

      if (foodsVarsError) {
        logger.error('Error fetching food variables for tabs', { error: foodsVarsError.message });
      } else {
        foods = (foodVars as SimpleVariableInfo[] || []).filter(f => f.name); // Ensure name exists
      }
    }

  } catch (error) {
    logger.error('Unexpected error fetching food variables for tabs', { error });
  }

  return foods;
} 