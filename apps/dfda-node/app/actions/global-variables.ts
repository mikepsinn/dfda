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

    if (!query || query.trim().length < 2) {
        return [];
    }

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