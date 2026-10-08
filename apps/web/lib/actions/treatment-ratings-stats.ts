"use server"

import { getUserDb } from '@/lib/db/server'
// Removed unused Database type
import { logger } from '@/lib/logger'
// Removed unused revalidatePath

// Remove base types if they are only used by removed functions
// export type TreatmentRating = Database["public"]["Tables"]["treatment_ratings"]["Row"]
// export type TreatmentRatingInsert = Database["public"]["Tables"]["treatment_ratings"]["Insert"]
// export type TreatmentRatingUpdate = Database["public"]["Tables"]["treatment_ratings"]["Update"]

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
  const db = await getUserDb();
  logger.info('Fetching effectiveness stats from view', { treatmentId, conditionId });

  // The view has one row per treatment and condition
  const data = await db.treatment_ratings_stats.findFirst({
    where: { treatment_id: treatmentId, condition_id: conditionId },
  });

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
  const db = await getUserDb();
  logger.info('Fetching conditions with effectiveness stats from view for treatment', { treatmentId });

  const stats = await db.treatment_ratings_stats.findMany({
    where: { treatment_id: treatmentId },
  });

  // Look up condition names/descriptions (a condition's id is its global variable id)
  const conditionIds = stats.flatMap(row => (row.condition_id ? [row.condition_id] : []));
  const conditions = await db.global_variables.findMany({
    where: { id: { in: conditionIds } },
    select: { id: true, name: true, description: true },
  });
  const conditionsById = new Map(conditions.map(condition => [condition.id, condition]));

  // Map the results
  const results = stats.flatMap(row => {
    if (!row.condition_id) return [];
    const condition = conditionsById.get(row.condition_id);

    return [{
      treatment_id: row.treatment_id, // Included for completeness if needed later
      condition_id: row.condition_id,
      condition_name: condition?.name ?? 'Unknown Condition',
      condition_description: condition?.description ?? null,
      total_ratings: row.total_ratings ?? 0,
      avg_effectiveness: row.average_effectiveness ?? null,
      positive_ratings_count: row.positive_ratings_count ?? 0,
      negative_ratings_count: row.negative_ratings_count ?? 0,
      neutral_ratings_count: row.neutral_ratings_count ?? 0
    }];
  });

  logger.info(`Processed effectiveness stats for ${results.length} conditions related to treatment from view`, { treatmentId });
  return results;
}

// --- Removed CRUD and Basic Fetch Actions ---
// Functions like getRatingsForConditionAction, getRatingsByPatientAction, 
// createTreatmentRatingAction, updateTreatmentRatingAction, deleteTreatmentRatingAction
// should now reside in app/actions/treatment-ratings.ts
