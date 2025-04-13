"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

// Import related types if needed
export type PatientTreatmentInsert = Database['public']['Tables']['patient_treatments']['Insert']
// Removed TreatmentRatingInsert as we don't handle ratings here anymore

// Simplified type for the input data structure
interface SelectedTreatment {
  treatmentId: string;
  treatmentName: string; // Keep for logging/context
}

// Removed TreatmentEntry and ConditionTreatmentState interfaces

// --- Server Action --- 

export async function addInitialPatientTreatmentsAction(
  userId: string,
  selectedTreatments: SelectedTreatment[] // Updated parameter type
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  logger.info('Adding initial patient treatments', { userId, count: selectedTreatments.length });

  if (!userId || !selectedTreatments || selectedTreatments.length === 0) {
    logger.warn('Attempted to add initial treatments with invalid input', { userId, selectedTreatments });
    return { success: false, error: 'Invalid input provided.' };
  }

  // Simplified data preparation for insertion
  const patientTreatmentsToInsert: Omit<PatientTreatmentInsert, 'id'>[] = selectedTreatments.map(treatment => ({
    patient_id: userId,
    treatment_id: treatment.treatmentId, // This is the global_variable_id
    // user_variable_id: null, // Explicitly null, assuming it links to condition/etc later
    status: 'active', // Default status
    start_date: new Date().toISOString(), // Default start date
    // patient_notes: null, // Omitting notes as dosage/schedule are deferred
    // patient_condition_id: null // Explicitly null as we don't link condition now
  }));

  // Removed logic for preparing/linking ratings

  // --- Perform Insertion --- 
  try {
    // 1. Insert Patient Treatments
    logger.info('Attempting to insert patient treatments', { userId, data: patientTreatmentsToInsert });
    const { data: insertedPatientTreatments, error: ptError } = await supabase
      .from('patient_treatments')
      .insert(patientTreatmentsToInsert) 
      .select('id, treatment_id'); // Select needed fields

    if (ptError || !insertedPatientTreatments) {
      logger.error('Error inserting initial patient treatments:', { userId, error: ptError });
      console.error("Supabase Insert Error (patient_treatments):", JSON.stringify(ptError, null, 2));
      throw new Error(ptError?.message || 'Failed to save patient treatments.');
    }

    logger.info('Successfully inserted patient treatments', { userId, count: insertedPatientTreatments.length });

    // 2. Removed Rating Insertion Logic

    // 3. Revalidation
    try {
      revalidatePath(`/patient`); // Revalidate the main patient dashboard
      revalidatePath(`/patient/treatments`); // Revalidate the treatments management page
      // Removed revalidation specific to conditions/ratings
      // Revalidate public treatment pages - maybe still relevant?
      const uniqueTreatmentIds = [...new Set(selectedTreatments.map(t => t.treatmentId))];
       uniqueTreatmentIds.forEach(tId => {
         revalidatePath(`/treatments/${tId}`); // Keep this for now
      });

    } catch (revalError) {
      logger.error('Error during revalidation after initial treatment add', { revalError, userId });
    }

    logger.info('Successfully added initial patient treatments', { userId });
    return { success: true };

  } catch (error) {
     logger.error('Operation failed in addInitialPatientTreatmentsAction', { userId, error: error instanceof Error ? error.message : String(error) });
     return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred.' };
  }
} 