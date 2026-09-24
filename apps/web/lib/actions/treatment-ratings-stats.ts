"use server"

import { createClient } from '@/utils/supabase/server'
// Removed unused Database type
import { logger } from '@/lib/logger'
// Removed unused revalidatePath

// Keep handleDatabaseResponse if needed, remove handleDatabaseCollectionResponse if unused after refactor
// import { handleDatabaseResponse, handleDatabaseCollectionResponse } from "@/lib/actions-helpers" 

// Remove base types if they are only used by removed functions
// export type TreatmentRating = Database["public"]["Tables"]["treatment_ratings"]["Row"]
// export type TreatmentRatingInsert = Database["public"]["Tables"]["treatment_ratings"]["Insert"]
// export type TreatmentRatingUpdate = Database["public"]["Tables"]["treatment_ratings"]["Update"]

// Type representing a row from the new view (adjust if needed after type generation)
// We map the view's columns to this type for clarity within the action
type TreatmentRatingsStatsRow = {
  treatment_id: string;
  condition_id: string;
  total_ratings: number;
  average_effectiveness: number | null; 
  positive_ratings_count: number; // View defines as >= 7
  negative_ratings_count: number; // View defines as <= 3
  neutral_ratings_count: number;  // View defines as > 3 and < 7
}

// Type for aggregated effectiveness statistics returned by actions
// Adjusted to match view's direct counts
export type EffectivenessStats = {
  total_ratings: number
  avg_effectiveness: number | null // Can be null if no ratings
  positive_ratings_count: number 
  negative_ratings_count: number
  neutral_ratings_count: number
}

// Type for associating conditions with effectiveness stats
// Kept condition name/description separate for clarity
export type TreatmentConditionEffectiveness = {
  condition_id: string
  condition_name: string | null // Fetch separately
  condition_description: string | null // Fetch separately
} & EffectivenessStats

// --- Refactored Aggregate Server Actions ---

/**
 * Get effectiveness stats for a specific treatment (global ID) and condition (global ID)
 * by querying the `treatment_ratings_stats` view.
 */
export async function getTreatmentEffectivenessStatsAction(
  treatmentId: string, 
  conditionId: string
): Promise<EffectivenessStats> {
  const supabase = await createClient();
  logger.info('Fetching effectiveness stats from view', { treatmentId, conditionId });

  const { data, error } = await supabase
    .from('treatment_ratings_stats') // Query the new view
    .select('*')
    .eq('treatment_id', treatmentId)
    .eq('condition_id', conditionId)
    .maybeSingle(); // Expect 0 or 1 row

  if (error) {
    logger.error("Error fetching treatment effectiveness stats from view:", { treatmentId, conditionId, error });
    throw new Error("Failed to fetch treatment effectiveness stats");
  }

  // Default stats if no ratings found for this combo
  const defaultStats: EffectivenessStats = {
    total_ratings: 0,
    avg_effectiveness: null,
    positive_ratings_count: 0,
    negative_ratings_count: 0,
    neutral_ratings_count: 0
  };

  if (!data) {
    logger.warn('No stats found in view for combination', { treatmentId, conditionId });
    return defaultStats;
  }

  // Map the view row to the action's return type
  const stats: EffectivenessStats = {
    total_ratings: data.total_ratings ?? 0,
    avg_effectiveness: data.average_effectiveness ?? null,
    positive_ratings_count: data.positive_ratings_count ?? 0,
    negative_ratings_count: data.negative_ratings_count ?? 0,
    neutral_ratings_count: data.neutral_ratings_count ?? 0
  };

  logger.info('Retrieved effectiveness stats from view', { treatmentId, conditionId, stats });
  return stats;
}

/**
 * Get all conditions a specific treatment (global ID) has effectiveness stats for,
 * along with those stats and condition details.
 */
export async function getTreatmentConditionsWithEffectivenessAction(
  treatmentId: string
): Promise<TreatmentConditionEffectiveness[]> {
  const supabase = await createClient();
  logger.info('Fetching conditions with effectiveness stats from view for treatment', { treatmentId });

  // Query the view and join to get condition names/descriptions
  const { data, error } = await supabase
    .from('treatment_ratings_stats') // Query the new view
    .select(`
      *,
      condition:conditions!inner (
        gv:global_variables!inner ( name, description )
      )
    `)
    .eq('treatment_id', treatmentId);

  if (error) {
    logger.error("Error fetching rated conditions stats from view:", { treatmentId, error });
    throw new Error("Failed to fetch treatment conditions with effectiveness stats");
  }

  if (!data) return [];

  // Map the results
  const results: TreatmentConditionEffectiveness[] = data.map(row => {
    // Type assertion needed here until Supabase types include the view and joins properly
    const typedRow = row as any as (TreatmentRatingsStatsRow & { condition: { gv: { name: string | null, description: string | null } | null } | null });
    
    return {
      treatment_id: typedRow.treatment_id, // Included for completeness if needed later
      condition_id: typedRow.condition_id,
      condition_name: typedRow.condition?.gv?.name ?? 'Unknown Condition',
      condition_description: typedRow.condition?.gv?.description ?? null,
      total_ratings: typedRow.total_ratings ?? 0,
      avg_effectiveness: typedRow.average_effectiveness ?? null,
      positive_ratings_count: typedRow.positive_ratings_count ?? 0,
      negative_ratings_count: typedRow.negative_ratings_count ?? 0,
      neutral_ratings_count: typedRow.neutral_ratings_count ?? 0
    };
  });

  logger.info(`Processed effectiveness stats for ${results.length} conditions related to treatment from view`, { treatmentId });
  return results;
}

// --- Removed CRUD and Basic Fetch Actions ---
// Functions like getRatingsForConditionAction, getRatingsByPatientAction, 
// createTreatmentRatingAction, updateTreatmentRatingAction, deleteTreatmentRatingAction
// should now reside in app/actions/treatment-ratings.ts
