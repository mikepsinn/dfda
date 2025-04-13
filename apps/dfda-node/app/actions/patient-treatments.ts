"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// Import related types if needed
export type PatientTreatmentInsert = Database['public']['Tables']['patient_treatments']['Insert']
export type TreatmentRatingInsert = Database['public']['Tables']['treatment_ratings']['Insert']

// Type definition for the input data structure from the client
interface TreatmentEntry {
  treatmentId: string;
  treatmentName: string; // Keep for logging/context if needed, not saved directly
  dosage: string;
  schedule: string;
  effectiveness: number | null;
}
interface ConditionTreatmentState {
  [conditionId: string]: TreatmentEntry[]; // conditionId here is patient_condition_id
}

// --- Server Action --- 

export async function addInitialPatientTreatmentsAction(
  userId: string,
  treatmentsByCondition: ConditionTreatmentState
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  logger.info('Adding initial patient treatments and ratings', { userId, conditionsCount: Object.keys(treatmentsByCondition).length });

  if (!userId || !treatmentsByCondition || Object.keys(treatmentsByCondition).length === 0) {
    logger.warn('Attempted to add initial treatments with invalid input', { userId, treatmentsByCondition });
    return { success: false, error: 'Invalid input provided.' };
  }

  const patientTreatmentsToInsert: Omit<PatientTreatmentInsert, 'id'>[] = [];
  const ratingsToInsert: Omit<TreatmentRatingInsert, 'id' | 'patient_treatment_id'>[] = [];
  const treatmentConditionMap: Record<string, { treatmentId: string, effectiveness: number | null }> = {}; // Map placeholder PT ID -> {treatmentId, effectiveness}
  
  // Prepare data for insertion
  for (const patientConditionId in treatmentsByCondition) {
    const treatments = treatmentsByCondition[patientConditionId];
    for (const treatment of treatments) {
      
      patientTreatmentsToInsert.push({
        patient_id: userId,
        treatment_id: treatment.treatmentId, // This is the global_variable_id
        user_variable_id: treatment.treatmentId, // Assuming treatment IS the user variable for now - adjust if needed
        status: 'active', // Default status
        start_date: new Date().toISOString(), // Default start date
        patient_notes: JSON.stringify({ 
            dosage: treatment.dosage, 
            schedule: treatment.schedule 
        }),
      });

      // Store details needed for rating linkage later
      // We'll link based on finding the inserted PT record with matching user, treatment_id, and intended patient_condition_id
      treatmentConditionMap[`${userId}-${treatment.treatmentId}-${patientConditionId}`] = {
         treatmentId: treatment.treatmentId,
         effectiveness: treatment.effectiveness
      };

      // Prepare rating data if provided (without patient_treatment_id yet)
      if (treatment.effectiveness !== null && treatment.effectiveness >= 0) {
        ratingsToInsert.push({
          patient_condition_id: patientConditionId,
          effectiveness_out_of_ten: treatment.effectiveness,
        });
      }
    }
  }

  // --- Perform Insertions --- 
  try {
    // 1. Insert Patient Treatments
    // Need to select `id` and `treatment_id` to link ratings correctly
    const { data: insertedPatientTreatments, error: ptError } = await supabase
      .from('patient_treatments')
      .insert(patientTreatmentsToInsert) 
      .select('id, treatment_id, patient_id'); // Select fields needed for linking + verification

    if (ptError || !insertedPatientTreatments) {
      logger.error('Error inserting initial patient treatments:', { userId, error: ptError });
      console.error("Supabase Insert Error (patient_treatments):", JSON.stringify(ptError, null, 2));
      throw new Error(ptError?.message || 'Failed to save patient treatments.');
    }

    logger.info('Successfully inserted patient treatments', { userId, count: insertedPatientTreatments.length });

    // 2. Prepare and Insert Ratings with correct patient_treatment_id
    if (ratingsToInsert.length > 0) {
      const finalRatingsToInsert: TreatmentRatingInsert[] = [];
      
      for (const ratingStub of ratingsToInsert) {
         // Find the linking info we stored earlier
         const linkInfoKey = Object.keys(treatmentConditionMap).find(key => 
             key.startsWith(`${userId}-`) && 
             key.endsWith(`-${ratingStub.patient_condition_id}`) &&
             treatmentConditionMap[key].effectiveness === ratingStub.effectiveness_out_of_ten
         );
         
         if (!linkInfoKey) {
             logger.error("Could not find link info for rating stub - skipping", { ratingStub });
             continue;
         }
         const linkInfo = treatmentConditionMap[linkInfoKey];
         const targetTreatmentId = linkInfo.treatmentId;

         // Find the ID of the patient_treatment record we just inserted
         const matchingInsertedPt = insertedPatientTreatments.find(pt => 
              pt.patient_id === userId && pt.treatment_id === targetTreatmentId
              // We assume the first match is correct here. If a user could have multiple
              // patient_treatment records for the same treatment_id created simultaneously,
              // this linking logic would need refinement (e.g., using the placeholder map idea)
         );

         if (!matchingInsertedPt) {
            logger.error("Could not find inserted patient_treatment for rating - skipping", { targetTreatmentId, ratingStub });
            continue; // Skip if no match found
         }

         finalRatingsToInsert.push({
            ...ratingStub,
            patient_treatment_id: matchingInsertedPt.id, // Use the actual inserted ID
         });

         // Optional: Remove key from map once used if needed, though not strictly necessary here
         // delete treatmentConditionMap[linkInfoKey]; 
      }


      if (finalRatingsToInsert.length > 0) {
          logger.info('Attempting to insert ratings', { count: finalRatingsToInsert.length, data: finalRatingsToInsert });
          const { error: ratingError } = await supabase
            .from('treatment_ratings')
            .insert(finalRatingsToInsert);

          if (ratingError) {
            logger.error('Error inserting initial treatment ratings:', { userId, error: ratingError });
             console.error("Supabase Insert Error (treatment_ratings):", JSON.stringify(ratingError, null, 2));
            throw new Error(ratingError.message || 'Failed to save treatment ratings.');
          }
           logger.info('Successfully inserted treatment ratings', { userId, count: finalRatingsToInsert.length });
      } else {
         logger.warn('No valid ratings could be prepared for insertion after linking.', { userId });
      }
    }

    // 3. Revalidation
    try {
      revalidatePath(`/patient`); // Revalidate the main patient dashboard
      revalidatePath(`/patient/treatments`); // Revalidate the treatments management page
      revalidatePath(`/patient/conditions`); // Revalidate conditions list page
      // Revalidate specific condition pages if applicable
      const patientConditionIds = Object.keys(treatmentsByCondition);
      patientConditionIds.forEach(pcId => {
         revalidatePath(`/patient/conditions/${pcId}`); 
      });
      // Revalidate public treatment pages if treatments were rated
      const uniqueTreatmentIds = [...new Set(Object.values(treatmentsByCondition).flat().map(t => t.treatmentId))];
       uniqueTreatmentIds.forEach(tId => {
         revalidatePath(`/treatments/${tId}`);
      });

    } catch (revalError) {
      logger.error('Error during revalidation after initial treatment add', { revalError, userId });
    }

    logger.info('Successfully added initial patient treatments and ratings', { userId });
    return { success: true };

  } catch (error) {
     logger.error('Operation failed in addInitialPatientTreatmentsAction', { userId, error: error instanceof Error ? error.message : String(error) });
     return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred.' };
  }
} 