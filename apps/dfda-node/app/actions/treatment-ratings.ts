"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { handleDatabaseResponse, handleDatabaseCollectionResponse } from '@/lib/actions-helpers'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// Types using the updated schema
export type TreatmentRating = Database['public']['Tables']['treatment_ratings']['Row']
export type TreatmentRatingInsert = Database['public']['Tables']['treatment_ratings']['Insert']
export type TreatmentRatingUpdate = Database['public']['Tables']['treatment_ratings']['Update']

// Define the expected shape for inserting/upserting data via actions
export type TreatmentRatingUpsertData = {
  patient_treatment_id: string;
  patient_condition_id: string;
  effectiveness_out_of_ten: number;
  review?: string | null;
}

// --- HELPER for Revalidation ---
// Renamed supabase client type for clarity inside function
type SupabaseClientType = Awaited<ReturnType<typeof createClient>>;
async function revalidateTreatmentPaths(supabase: SupabaseClientType, patientTreatmentId: string, patientConditionId: string) {
   try {
    // Fetch patient_treatment to get related IDs for path revalidation
    const { data: pt, error: ptError } = await supabase
      .from('patient_treatments')
      .select('patient_id, treatment_id') // Select fields needed for paths
      .eq('id', patientTreatmentId)
      .single();

    if (ptError) throw ptError; // Rethrow error if fetching patient_treatment fails

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
  const supabase = await createClient()
  logger.info("Fetching rating for patient treatment and patient condition", { patientTreatmentId, patientConditionId });

  if (!patientTreatmentId || !patientConditionId) {
    logger.warn('getRatingForPatientTreatmentPatientConditionAction missing IDs', { patientTreatmentId, patientConditionId });
    return null;
  }

  const response = await supabase
    .from('treatment_ratings')
    .select('*')
    .eq('patient_treatment_id', patientTreatmentId)
    .eq('patient_condition_id', patientConditionId)
    .maybeSingle()

  if (response.error && response.error.code !== 'PGRST116') {
    logger.error('Error fetching treatment rating:', { patientTreatmentId, patientConditionId, error: response.error })
    throw new Error('Failed to fetch treatment rating');
  }

  return response.data;
}

// Upsert (create or update) a rating for a specific patient_treatment and patient_condition
export async function upsertTreatmentRatingAction(
  ratingData: TreatmentRatingUpsertData
): Promise<{ success: boolean; data?: TreatmentRating; error?: string; message?: string }> {
  const supabase = await createClient()
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

    const { data: upsertedRating, error } = await supabase
      .from('treatment_ratings')
      .upsert(upsertData, {
          // Upsert based on the unique combination
          onConflict: 'patient_treatment_id, patient_condition_id',
      })
      .select()
      .single()

    if (error) {
      logger.error("Error upserting treatment rating", { ratingData, error })
      throw error
    }

    logger.info("Successfully upserted treatment rating", { upsertedRating })

    // Revalidate paths - Await client creation and pass instance
    const supabaseClient = await createClient();
    await revalidateTreatmentPaths(supabaseClient, ratingData.patient_treatment_id, ratingData.patient_condition_id);

    return { success: true, data: upsertedRating, message: "Treatment rating saved successfully." }

  } catch (error) {
    logger.error("Failed in upsertTreatmentRatingAction", { ratingData, error: error instanceof Error ? error.message : String(error) })
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage }
  }
}

// --- OTHER ACTIONS (Delete, Helpful, GetByID) ---

// Delete a rating (operates on rating ID)
export async function deleteTreatmentRatingAction(id: string): Promise<{success: boolean, error?: string}> {
  const supabase = await createClient()
  logger.warn('Deleting treatment rating', { ratingId: id });

  // Get the rating before deleting to get patient_treatment_id for revalidation
  const rating = await getTreatmentRatingByIdAction(id); // Use existing action to get full record
  if (!rating || !rating.patient_treatment_id || !rating.patient_condition_id) {
      logger.error('Rating not found or missing required IDs for deletion', { ratingId: id });
      return { success: false, error: 'Rating not found or cannot be deleted.' };
  }
  const patientTreatmentId = rating.patient_treatment_id;
  const patientConditionId = rating.patient_condition_id;

  const { error } = await supabase
    .from('treatment_ratings')
    .delete()
    .eq('id', id);

  if (error) {
    logger.error('Error deleting treatment rating:', { error: error, ratingId: id })
    return { success: false, error: 'Failed to delete rating.' };
  }

  // Revalidate relevant paths using the fetched patientTreatmentId
  // Await client creation and pass instance
  const supabaseClient = await createClient();
  await revalidateTreatmentPaths(supabaseClient, patientTreatmentId, patientConditionId);
  return { success: true };
}

// Mark a rating as helpful (operates on rating ID)
export async function markRatingAsHelpfulAction(id: string): Promise<{success: boolean, error?: string}> {
  const supabase = await createClient()
  logger.info('Marking rating as helpful', { ratingId: id });

  // Get the rating first to ensure it exists and get patient_treatment_id
  const rating = await getTreatmentRatingByIdAction(id);
  if (!rating || !rating.patient_treatment_id || !rating.patient_condition_id) {
      logger.error('Rating not found or missing required IDs for helpful mark', { ratingId: id });
      return { success: false, error: 'Rating not found.' };
  }
  const patientTreatmentId = rating.patient_treatment_id;
  const patientConditionId = rating.patient_condition_id;

  // Increment helpful_count using an update rpc seems better if exists
  // Let's try calling an RPC function assuming one exists or can be created
  // const { error: rpcError } = await supabase.rpc('increment_helpful_count', { p_rating_id: id });
  // Fallback to update if RPC doesn't exist/fails:
   const { error: updateError } = await supabase
     .from('treatment_ratings')
     .update({ helpful_count: (rating.helpful_count || 0) + 1 })
     .eq('id', id);

  if (updateError) { // Replace with rpcError if using RPC
    logger.error('Error marking rating as helpful:', { error: updateError, ratingId: id })
    return { success: false, error: 'Failed to mark rating as helpful.' };
  }

  // Revalidate relevant paths
  // Await client creation and pass instance
  const supabaseClient = await createClient();
  await revalidateTreatmentPaths(supabaseClient, patientTreatmentId, patientConditionId);
  return { success: true };
}

// Get a specific rating by ID (Keep as is, it's useful for getting full record)
export async function getTreatmentRatingByIdAction(id: string): Promise<TreatmentRating | null> {
  const supabase = await createClient()
  logger.info('Fetching treatment rating by ID', { ratingId: id });

  const response = await supabase
    .from('treatment_ratings')
    .select('*') // Select all including patient_treatment_id
    .eq('id', id)
    .maybeSingle() // Use maybeSingle

  if (response.error && response.error.code !== 'PGRST116') {
    logger.error('Error fetching treatment rating by ID:', { error: response.error, ratingId: id })
    throw new Error('Failed to fetch treatment rating by ID')
  }

  return response.data; // Will be null if not found or PGRST116
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
  const supabase = await createClient();
  logger.info('Fetching ratings for condition', { conditionId });

  const { data, error } = await supabase
    .from('treatment_ratings')
    .select(`
      *,
      pc:patient_conditions!inner(condition_id),
      pt:patient_treatments!inner(
        treatment:treatments!inner(
           gv:global_variables!inner( name ) 
        )
      )
    `)
    .eq('pc.condition_id', conditionId)
    .not('deleted_at', 'is', null)
    .order('effectiveness_out_of_ten', { ascending: false });

  if (error) {
    logger.error("Error fetching ratings for condition:", { conditionId, error });
    throw new Error("Failed to fetch ratings for condition");
  }
   if (!data) return [];

   // Map the data, extracting the treatment name from the nested structure
   const result = data.map(row => {
     // Use type assertion for clarity, adjust based on exact generated types if needed
     const typedRow = row as any;
     const treatmentName = typedRow.pt?.treatment?.gv?.name ?? null;
     // Remove nested join objects (pt, pc) before returning
     const { pt, pc, ...rest } = typedRow;
     return { ...rest, treatment_name: treatmentName };
   });

   return result as (TreatmentRating & { treatment_name: string | null })[];
}

/**
 * Get all ratings submitted by a specific patient.
 */
export async function getRatingsByPatientAction(
  patientId: string
): Promise<TreatmentRating[]> {
  const supabase = await createClient();
  logger.info('Fetching ratings for patient', { patientId });

  // Assuming patient_id is available via patient_conditions join
  const response = await supabase
    .from("treatment_ratings")
    .select(`
      *,
      pc:patient_conditions!inner(patient_id) 
    `)
    .eq("pc.patient_id", patientId)
    .not('deleted_at', 'is', null);

  if (response.error) {
    logger.error("Error fetching patient ratings:", { patientId, error: response.error });
    throw new Error("Failed to fetch patient ratings");
  }
  
  // Remove the intermediate join object before returning
  return (response.data || []).map(({ pc, ...rest }) => rest);
}

/**
 * Get all ratings linked to a specific treatment (global ID).
 */
export async function getRatingsByTreatmentAction(
  treatmentId: string 
): Promise<TreatmentRating[]> {
  const supabase = await createClient();
   logger.info('Fetching ratings by treatment', { treatmentId });

  // Assuming treatment_id is available via patient_treatments join
  const response = await supabase
    .from("treatment_ratings")
    .select(`
      *,
      pt:patient_treatments!inner(treatment_id)
    `)
    .eq("pt.treatment_id", treatmentId) 
    .not('deleted_at', 'is', null);

  if (response.error) {
    logger.error("Error fetching ratings by treatment:", { treatmentId, error: response.error });
    throw new Error("Failed to fetch ratings by treatment");
  }

  // Remove the intermediate join object before returning
  return (response.data || []).map(({ pt, ...rest }) => rest);
}

/**
 * Get all ratings linked to a specific treatment AND condition (global IDs).
 */
export async function getRatingsByTreatmentAndConditionAction(
  treatmentId: string, 
  conditionId: string
): Promise<TreatmentRating[]> {
  const supabase = await createClient();
  logger.info('Fetching ratings by treatment and condition', { treatmentId, conditionId });

  const response = await supabase
    .from("treatment_ratings")
    .select(`
      *,
      pt:patient_treatments!inner(treatment_id),
      pc:patient_conditions!inner(condition_id)
    `)
    .eq("pt.treatment_id", treatmentId) 
    .eq("pc.condition_id", conditionId) 
    .not('deleted_at', 'is', null);

  if (response.error) {
    logger.error("Error fetching ratings by treatment and condition:", { treatmentId, conditionId, error: response.error });
    throw new Error("Failed to fetch ratings by treatment and condition");
  }

  // Remove the intermediate join objects before returning
  return (response.data || []).map(({ pt, pc, ...rest }) => rest);
}
