"use server"

import { getUserDb } from '@/lib/db/server'
import type { UserDb } from '@/lib/db'
import type { Tables } from '@/lib/database.types'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'

// Types using the updated schema
/**
 * Represents a TreatmentRating record.
 */
export type TreatmentRating = Tables<"treatment_ratings">;

// Define the expected shape for inserting/upserting data via actions
export type TreatmentRatingUpsertData = {
  patient_treatment_id: string;
  patient_condition_id: string;
  effectiveness_out_of_ten: number;
  review?: string | null;
}

// --- HELPER for Revalidation ---
async function revalidateTreatmentPaths(db: UserDb, patientTreatmentId: string) {
   try {
    // Fetch patient_treatment to get related IDs for path revalidation
    const pt = await db.patient_treatments.findUnique({
      where: { id: patientTreatmentId },
      select: { patient_id: true, treatment_id: true }, // Select fields needed for paths
    });

    if (pt) {
      revalidatePath(`/patient/treatments`); // General page where list is shown
      // Example specific paths (uncomment/adjust if these pages exist)
      // logger.info('Revalidating specific paths', { treatmentId: pt.treatment_id, patientId: pt.patient_id });
      // revalidatePath(`/treatment/${pt.treatment_id}`);
      // revalidatePath(`/patient/${pt.patient_id}/treatments`); // Potential patient-specific page
    } else {
       logger.warn('Patient treatment not found during revalidation', { patientTreatmentId });
       revalidatePath(`/patient/treatments`); // Fallback revalidation
    }
  } catch (revalError) {
      logger.error('Error during revalidation path fetching', { patientTreatmentId, error: revalError instanceof Error ? revalError.message : String(revalError) });
      revalidatePath(`/patient/treatments`); // Fallback revalidation
  }
}

// --- UPDATED/NEW ACTIONS ---

// Get the rating for a specific patient_treatment and patient_condition
export async function getRatingForPatientTreatmentPatientConditionAction(
    patientTreatmentId: string,
    patientConditionId: string
): Promise<TreatmentRating | null> {
  const db = await getUserDb()
  logger.info("Fetching rating for patient treatment and patient condition", { patientTreatmentId, patientConditionId });

  if (!patientTreatmentId || !patientConditionId) {
    logger.warn('getRatingForPatientTreatmentPatientConditionAction missing IDs', { patientTreatmentId, patientConditionId });
    return null;
  }

  return db.treatment_ratings.findUnique({
    where: {
      patient_treatment_id_patient_condition_id: {
        patient_treatment_id: patientTreatmentId,
        patient_condition_id: patientConditionId,
      },
    },
  })
}

// Upsert (create or update) a rating for a specific patient_treatment and patient_condition
export async function upsertTreatmentRatingAction(
  ratingData: TreatmentRatingUpsertData
): Promise<{ success: boolean; data?: TreatmentRating; error?: string; message?: string }> {
  const db = await getUserDb()
  logger.info("Upserting treatment rating", { patientTreatmentId: ratingData.patient_treatment_id, patientConditionId: ratingData.patient_condition_id });

  // Validation
  if (!ratingData.patient_treatment_id || !ratingData.patient_condition_id) {
    return { success: false, error: "Patient Treatment ID and Patient Condition ID are required." };
  }
  if (ratingData.effectiveness_out_of_ten === undefined || ratingData.effectiveness_out_of_ten === null) {
     return { success: false, error: "Effectiveness rating (0-10) is required." };
  }
  if (ratingData.effectiveness_out_of_ten < 0 || ratingData.effectiveness_out_of_ten > 10) {
      return { success: false, error: "Effectiveness must be between 0 and 10." };
  }

  try {
    const upsertData = {
        patient_treatment_id: ratingData.patient_treatment_id,
        patient_condition_id: ratingData.patient_condition_id,
        effectiveness_out_of_ten: ratingData.effectiveness_out_of_ten,
        review: ratingData.review || null,
    };

    let upsertedRating: TreatmentRating;
    try {
      upsertedRating = await db.treatment_ratings.upsert({
        // Upsert based on the unique combination
        where: {
          patient_treatment_id_patient_condition_id: {
            patient_treatment_id: upsertData.patient_treatment_id,
            patient_condition_id: upsertData.patient_condition_id,
          },
        },
        create: upsertData,
        update: upsertData,
      })
    } catch (error) {
      logger.error("Error upserting treatment rating", { ratingData, error })
      throw error
    }

    logger.info("Successfully upserted treatment rating", { upsertedRating })

    await revalidateTreatmentPaths(db, ratingData.patient_treatment_id);

    // *** ADD REVALIDATION FOR THE CONDITION PAGE ***
    logger.info("Revalidating condition page path", { path: `/patient/conditions/${ratingData.patient_condition_id}` });
    revalidatePath(`/patient/conditions/${ratingData.patient_condition_id}`);

    return { success: true, data: upsertedRating, message: "Treatment rating saved successfully." }

  } catch (error) {
    logger.error("Failed in upsertTreatmentRatingAction", { ratingData, error: error instanceof Error ? error.message : String(error) })
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage }
  }
}

// --- Specific Fetch Actions ---

// Get ratings linked to a specific patient_condition_id, joining treatment name
export type PatientConditionRating = TreatmentRating & {
  treatment_name: string | null
  treatment_id: string | null // Include global treatment ID
}

export async function getRatingsForPatientConditionAction(
  patientConditionId: string
): Promise<PatientConditionRating[]> {
  const db = await getUserDb();
  logger.info('Fetching ratings for patient condition', { patientConditionId });

  const ratings = await db.treatment_ratings.findMany({
    where: { patient_condition_id: patientConditionId, deleted_at: null },
    include: {
      patient_treatments: {
        select: {
          global_treatments: { select: { id: true, global_variables: { select: { name: true } } } },
        },
      },
    },
    orderBy: { updated_at: 'desc' },
  });

   // Map the data, extracting the treatment name and ID from the nested structure.
   // patient_treatments is null when row-level security hides the treatment row.
   logger.info(`Fetched ${ratings.length} raw rating rows`, { patientConditionId });
   const result = ratings.map(({ patient_treatments, ...rating }) => ({
     ...rating,
     treatment_name: patient_treatments?.global_treatments.global_variables.name ?? null,
     treatment_id: patient_treatments?.global_treatments.id ?? null,
   }));

   logger.info(`Returning ${result.length} mapped ratings`, { patientConditionId });
   return result;
}

// --- OTHER ACTIONS (Delete, Helpful, GetByID) ---

// Delete a rating (operates on rating ID)
export async function deleteTreatmentRatingAction(id: string): Promise<{success: boolean, error?: string}> {
  const db = await getUserDb()
  logger.warn('Deleting treatment rating', { ratingId: id });

  // Get the rating before deleting to get patient_treatment_id for revalidation
  const rating = await getTreatmentRatingByIdAction(id); // Use existing action to get full record
  if (!rating || !rating.patient_treatment_id || !rating.patient_condition_id) {
      logger.error('Rating not found or missing required IDs for deletion', { ratingId: id });
      return { success: false, error: 'Rating not found or cannot be deleted.' };
  }
  const patientTreatmentId = rating.patient_treatment_id;

  try {
    await db.treatment_ratings.deleteMany({ where: { id } });
  } catch (error) {
    logger.error('Error deleting treatment rating:', { error: error, ratingId: id })
    return { success: false, error: 'Failed to delete rating.' };
  }

  // Revalidate relevant paths using the fetched patientTreatmentId
  await revalidateTreatmentPaths(db, patientTreatmentId);
  return { success: true };
}

// Mark a rating as helpful (operates on rating ID)
export async function markRatingAsHelpfulAction(id: string): Promise<{success: boolean, error?: string}> {
  const db = await getUserDb()
  logger.info('Marking rating as helpful', { ratingId: id });

  // Get the rating first to ensure it exists and get patient_treatment_id
  const rating = await getTreatmentRatingByIdAction(id);
  if (!rating || !rating.patient_treatment_id || !rating.patient_condition_id) {
      logger.error('Rating not found or missing required IDs for helpful mark', { ratingId: id });
      return { success: false, error: 'Rating not found.' };
  }
  const patientTreatmentId = rating.patient_treatment_id;

  try {
    await db.treatment_ratings.updateMany({
      where: { id },
      data: { helpful_count: (rating.helpful_count || 0) + 1 },
    });
  } catch (updateError) {
    logger.error('Error marking rating as helpful:', { error: updateError, ratingId: id })
    return { success: false, error: 'Failed to mark rating as helpful.' };
  }

  // Revalidate relevant paths
  await revalidateTreatmentPaths(db, patientTreatmentId);
  return { success: true };
}

// Get a specific rating by ID (Keep as is, it's useful for getting full record)
export async function getTreatmentRatingByIdAction(id: string): Promise<TreatmentRating | null> {
  const db = await getUserDb()
  logger.info('Fetching treatment rating by ID', { ratingId: id });

  return db.treatment_ratings.findUnique({ where: { id } }); // null if not found
}

// --- DEPRECATED / NEEDS REWORK ---
// Consider removing these from export if they are no longer used externally

// /* DEPRECATED - Was for specific treatment/condition, less relevant now */
// export async function getTreatmentRatingsAction(...) {}

// /* DEPRECATED - Replaced by getRatingForPatientTreatmentAction */
// export async function getUserTreatmentRatingAction(...) {}

// /* NEEDS REWORK - RPC needs rework based on patient_treatments or calculation done differently */
// export async function getAverageTreatmentRatingAction(...) {}

// /* DEPRECATED - Replaced by upsertTreatmentRatingAction */
// export async function addTreatmentRatingAction(...) {}

// --- ADDED ACTIONS (Moved from effectiveness file) ---

/**
 * Get all ratings for a specific condition (global ID), joining treatment info.
 */
export async function getRatingsForConditionAction(
  conditionId: string
): Promise<(TreatmentRating & { treatment_name: string | null })[]> {
  const db = await getUserDb();
  logger.info('Fetching ratings for condition', { conditionId });

  const ratings = await db.treatment_ratings.findMany({
    where: {
      deleted_at: null,
      patient_conditions: { is: { condition_id: conditionId } },
    },
    include: {
      patient_treatments: {
        select: { global_treatments: { select: { global_variables: { select: { name: true } } } } },
      },
    },
    orderBy: { effectiveness_out_of_ten: 'desc' },
  });

   // Map the data, extracting the treatment name from the nested structure
   // (patient_treatments is null when row-level security hides the treatment row)
   return ratings.map(({ patient_treatments, ...rating }) => ({
     ...rating,
     treatment_name: patient_treatments?.global_treatments.global_variables.name ?? null,
   }));
}

/**
 * Get all ratings submitted by a specific patient.
 */
export async function getRatingsByPatientAction(
  patientId: string
): Promise<TreatmentRating[]> {
  const db = await getUserDb();
  logger.info('Fetching ratings for patient', { patientId });

  // Assuming patient_id is available via patient_conditions join
  return db.treatment_ratings.findMany({
    where: {
      patient_conditions: { is: { patient_id: patientId } },
      deleted_at: { not: null },
    },
  });
}

/**
 * Get all ratings linked to a specific treatment (global ID).
 */
export async function getRatingsByTreatmentAction(
  treatmentId: string
): Promise<TreatmentRating[]> {
  const db = await getUserDb();
   logger.info('Fetching ratings by treatment', { treatmentId });

  // Assuming treatment_id is available via patient_treatments join
  return db.treatment_ratings.findMany({
    where: {
      patient_treatments: { is: { treatment_id: treatmentId } },
      deleted_at: { not: null },
    },
  });
}

/**
 * Get all ratings linked to a specific treatment AND condition (global IDs).
 */
export async function getRatingsByTreatmentAndConditionAction(
  treatmentId: string,
  conditionId: string
): Promise<TreatmentRating[]> {
  const db = await getUserDb();
  logger.info('Fetching ratings by treatment and condition', { treatmentId, conditionId });

  return db.treatment_ratings.findMany({
    where: {
      patient_treatments: { is: { treatment_id: treatmentId } },
      patient_conditions: { is: { condition_id: conditionId } },
      deleted_at: { not: null },
    },
  });
}
