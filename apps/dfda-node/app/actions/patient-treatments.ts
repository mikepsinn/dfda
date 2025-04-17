"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
// Import the new custom client insert type
import type { PatientTreatmentClientInsert } from '@/lib/database.types.custom';
// Import reminder action for single add
import { createDefaultReminderAction } from "./reminder-schedules"

// Import related types if needed
export type PatientTreatmentInsert = Database['public']['Tables']['patient_treatments']['Insert']
// Removed UserVariableInsert as we won't manually upsert it
// export type UserVariableInsert = Database['public']['Tables']['user_variables']['Insert'] 

// Type for the input data when selecting treatments in the UI
// Assuming it provides global treatment ID and maybe name
export type SelectedTreatment = {
  treatmentId: string; 
  treatmentName: string;
}

// Type for the input data for single add action
interface AddPatientTreatmentInput {
  patient_id: string; // User's UUID
  treatment_id: string; // Global variable TEXT ID (e.g., 'metformin')
  // Add other optional fields if needed, e.g., start_date
}

// Define a type for the PatientTreatment data fetched with treatment name
export type PatientTreatmentWithName = Database['public']['Tables']['patient_treatments']['Row'] & {
  treatments: {
    global_variables: { name: string | null } | null
  } | null
}

// Removed TreatmentEntry and ConditionTreatmentState interfaces

// --- Server Action --- 

// Action to get all treatments for a patient
export async function getPatientTreatmentsAction(patientId: string): Promise<PatientTreatmentWithName[]> {
  const supabase = await createClient()
  logger.info('Fetching treatments for patient', { patientId });

  const { data, error } = await supabase
    .from('patient_treatments')
    .select(`
      *,
      treatments!inner(
        global_variables!inner(
          name
        )
      )
    `)
    .eq('patient_id', patientId)
    .is('end_date', null) // Optionally filter for currently active treatments
    .order('start_date', { ascending: false });

  if (error) {
    logger.error('Error fetching patient treatments:', { patientId, error });
    throw new Error('Failed to fetch patient treatments');
  }

  return data || [];
}

export async function addInitialPatientTreatmentsAction(
  userId: string,
  selectedTreatments: SelectedTreatment[] // Updated parameter type
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  logger.info('Adding initial patient treatments via trigger', { userId, count: selectedTreatments.length });

  if (!userId || !selectedTreatments || selectedTreatments.length === 0) {
    logger.warn('Attempted to add initial treatments with invalid input', { userId, selectedTreatments });
    return { success: false, error: 'Invalid input provided.' };
  }

  try {
    // 1. Prepare Patient Treatments for Insertion (using Client type)
    // user_variable_id will be handled by the database trigger
    const patientTreatmentsToInsert: PatientTreatmentClientInsert[] = selectedTreatments.map(treatment => {
      return {
        patient_id: userId,
        treatment_id: treatment.treatmentId, // This remains the global_variable_id
        // user_variable_id is intentionally omitted
        status: 'active', // Default status
        start_date: new Date().toISOString(), // Default start date
        is_prescribed: false, // Default value
      };
    });

    // 2. Perform Patient Treatment Insertion (with casting)
    logger.info('Attempting to insert patient treatments', { userId, data: patientTreatmentsToInsert });
    const { data: insertedPatientTreatments, error: ptError } = await supabase
      .from('patient_treatments')
      // Cast to the full Insert type array, relying on trigger for user_variable_id
      .insert(patientTreatmentsToInsert as PatientTreatmentInsert[])
      .select('id, treatment_id');

    if (ptError || !insertedPatientTreatments) {
      logger.error('Error inserting initial patient treatments:', { userId, error: ptError });
      // Use console.error for more visibility during development if needed
      // console.error("Supabase Insert Error (patient_treatments):", JSON.stringify(ptError, null, 2));
      throw new Error(ptError?.message || 'Failed to save patient treatments.');
    }

    logger.info('Successfully inserted patient treatments', { userId, count: insertedPatientTreatments.length });

    // 3. Revalidation
    try {
      revalidatePath(`/patient`);
      revalidatePath(`/patient/treatments`);
      const uniqueTreatmentIds = [...new Set(selectedTreatments.map(t => t.treatmentId))];
      uniqueTreatmentIds.forEach(tId => {
        revalidatePath(`/treatments/${tId}`);
      });
    } catch (revalError) {
      logger.error('Error during revalidation after initial treatment add', { revalError, userId });
      // Don't fail the whole operation for revalidation error
    }

    logger.info('Successfully added initial patient treatments', { userId });
    return { success: true };

  } catch (error) {
    logger.error('Operation failed in addInitialPatientTreatmentsAction', { userId, error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred.' };
  }
}

// Action for adding a single treatment (e.g., from search or specific page)
export async function addSinglePatientTreatmentAction(
  input: AddPatientTreatmentInput
): Promise<{ success: boolean; error?: string; data?: { id: string } }> {
  const supabase = await createClient()

  // 1. Get current user session
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    logger.error("User not authenticated", { error: authError });
    return { success: false, error: "Authentication failed." };
  }

  // 2. Validate input (ensure user ID matches authenticated user)
  if (user.id !== input.patient_id) {
      logger.error("User ID mismatch", { authUserId: user.id, inputUserId: input.patient_id });
      return { success: false, error: "Authorization error." };
  }

  logger.info("Attempting to add patient treatment via trigger", { userId: input.patient_id, treatmentId: input.treatment_id });

  try {
    // 3. Prepare data for patient_treatments insertion (using Client type)
    // user_variable_id will be handled by the database trigger
    const treatmentData: PatientTreatmentClientInsert = { 
        patient_id: input.patient_id,
        treatment_id: input.treatment_id,
        // user_variable_id is intentionally omitted
        status: 'active', // Set default status
        is_prescribed: false, // Default value
        start_date: new Date().toISOString(), // Default start date
        // Optional fields like patient_notes can be added here if needed
    };

    // 4. Perform the insert operation (with casting)
    // Select the user_variable_id generated/found by the trigger
    const { data, error } = await supabase
      .from("patient_treatments")
      .insert(treatmentData as PatientTreatmentInsert) // Cast here
      .select("id, user_variable_id") // Select ID and the trigger-handled user_variable_id
      .single(); // Expect only one row to be inserted

    // 5. Handle potential errors
    if (error) {
      logger.error("Failed to insert patient treatment", { error: error.message, input, treatmentData });
      // Check for unique constraint violation (patient_id, treatment_id)
      if (error.code === '23505') { 
           return { success: false, error: "This treatment is likely already tracked for this patient." };
      }
      throw new Error(error.message || "Database error occurred inserting patient treatment.");
    }
    
    if (!data?.id || !data.user_variable_id) { // Check both IDs were returned
       logger.error("Insert succeeded but ID or user_variable_id missing", { input, returnedData: data });
       throw new Error("Failed to get ID or user_variable_id of new treatment record.");
    }

    // Destructure needed IDs after successful insert
    const newPatientTreatmentId = data.id;
    const userVariableId = data.user_variable_id; 

    logger.info("Successfully inserted patient treatment", { newPatientTreatmentId, userVariableId });

    // 6. Fetch treatment name for default reminder (no change needed here)
    const { data: treatmentDetails, error: nameError } = await supabase
      .from('global_variables')
      .select('name')
      .eq('id', input.treatment_id)
      .single();

    // 7. Create Default Reminder (Fire and Forget) - Pass the retrieved userVariableId
    if (nameError || !treatmentDetails?.name) {
      logger.warn("Could not fetch treatment name for default reminder", { userId: input.patient_id, treatmentId: input.treatment_id, error: nameError });
    } else {
      createDefaultReminderAction(input.patient_id, userVariableId, treatmentDetails.name, 'treatment') // Pass userVariableId now
        .then(result => {
          if (!result.success) {
            logger.error("Failed to create default reminder for new treatment", { userId: input.patient_id, treatmentId: input.treatment_id, userVariableId, error: result.error });
          } else {
            logger.info("Successfully triggered default reminder creation for new treatment", { userId: input.patient_id, treatmentId: input.treatment_id, userVariableId });
          }
        })
        .catch(err => {
          logger.error("Error calling createDefaultReminderAction for treatment", { userId: input.patient_id, treatmentId: input.treatment_id, userVariableId, error: err });
        });
    }

    // 8. Revalidate the path to update the UI
    revalidatePath("/patient/treatments"); 

    // 9. Return success
    logger.info("Successfully added patient treatment and triggered reminder creation", { newPatientTreatmentId });
    return { success: true, data: { id: newPatientTreatmentId } }; // Return only patient_treatment id as before

  } catch (error) {
    logger.error("Error in addSinglePatientTreatmentAction", { error: error instanceof Error ? error.message : String(error), input });
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred." };
  }
} 