"use server"

import { getUserDb } from '@/lib/db/server'
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
    logger.info("Fetching global variable by ID", { globalVariableId });

    if (!globalVariableId) {
        logger.warn("getGlobalVariableByIdAction called with no ID");
        return null;
    }

    try {
        const db = await getUserDb();
        return await db.global_variables.findUnique({
            where: { id: globalVariableId },
        });
    } catch (error) {
        logger.error("Error fetching global variable", { globalVariableId, error });
        // Don't throw, return null to allow the calling page to handle "not found"
        return null;
    }
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
    logger.info("Searching predictors", { query });

    //if (!query || query.trim().length < 2) {return [];}

    try {
        const db = await getUserDb();
        return await db.global_variables.findMany({
            where: {
                variable_category_id: { in: PREDICTOR_CATEGORIES },
                name: { contains: query.trim(), mode: 'insensitive' },
            },
            select: { id: true, name: true },
            take: 10,
        });
    } catch (error) {
        logger.error("Error searching predictors", { query, error });
        return []; // Don't throw, return empty array
    }
}

// --- Actions to get variables by intervention type ---

// Renamed from TabVariable for better reusability
interface SimpleVariableInfo {
  id: string;
  name: string;
}

// Renamed and modified to fetch ONLY treatments
export async function getTreatmentVariables(limit: number = 9): Promise<SimpleVariableInfo[]> {
  const db = await getUserDb();

  // 1. Get IDs from treatments table
  let treatmentIds: string[];
  try {
    const treatmentIdsData = await db.global_treatments.findMany({
      select: { id: true },
      take: limit * 2, // Fetch more initially
    });
    treatmentIds = treatmentIdsData.map(t => t.id);
  } catch (error) {
    logger.error('Error fetching treatment IDs for tabs', { error });
    return [];
  }

  // 2. Fetch global_variables using the IDs
  if (treatmentIds.length === 0) {
    return [];
  }
  try {
    const treatmentVars = await db.global_variables.findMany({
      where: { id: { in: treatmentIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: limit,
    });
    return treatmentVars.filter(t => t.name); // Ensure name exists
  } catch (error) {
    logger.error('Error fetching treatment variables for tabs', { error });
    return [];
  }
}

// New action to fetch ONLY foods
export async function getFoodVariables(limit: number = 9): Promise<SimpleVariableInfo[]> {
  const db = await getUserDb();

  // 1. Get IDs from global_foods table
  let foodIds: string[];
  try {
    const foodIdsData = await db.global_foods.findMany({
      select: { global_variable_id: true },
      take: limit * 2, // Fetch more initially
    });
    foodIds = foodIdsData.map(f => f.global_variable_id);
  } catch (error) {
    logger.error('Error fetching food IDs for tabs', { error });
    return [];
  }

  // 2. Fetch global_variables using the IDs
  if (foodIds.length === 0) {
    return [];
  }
  try {
    const foodVars = await db.global_variables.findMany({
      where: { id: { in: foodIds } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
      take: limit,
    });
    return foodVars.filter(f => f.name); // Ensure name exists
  } catch (error) {
    logger.error('Error fetching food variables for tabs', { error });
    return [];
  }
} 