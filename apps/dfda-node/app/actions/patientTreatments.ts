"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/database.types"
import { createDefaultReminderAction } from "./reminder-schedules"

type PatientTreatmentInsert = Database["public"]["Tables"]["patient_treatments"]["Insert"]

// Define the expected input structure
interface AddPatientTreatmentInput {
  patient_id: string; // User's UUID
  treatment_id: string; // Global variable TEXT ID (e.g., 'metformin')
  // Add other optional fields if needed, e.g., start_date
}

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

  logger.info("Attempting to add patient treatment", { userId: input.patient_id, treatmentId: input.treatment_id });

  try {
    // 3. Find or Create User Variable Record
    let userVariableId: string;

    const { data: existingUserVar, error: uvCheckError } = await supabase
        .from('user_variables')
        .select('id')
        .eq('user_id', input.patient_id)
        .eq('global_variable_id', input.treatment_id)
        .maybeSingle();

    if (uvCheckError) {
        logger.error("Error checking for existing user_variable", { error: uvCheckError, input });
        throw new Error("Database error checking user variable.");
    }

    if (existingUserVar) {
        userVariableId = existingUserVar.id;
        logger.info("Found existing user_variable", { userVariableId });
    } else {
        logger.info("User variable not found, creating new one", { input });
        const { data: newUserVar, error: uvInsertError } = await supabase
            .from('user_variables')
            .insert({
                user_id: input.patient_id,
                global_variable_id: input.treatment_id,
                // Ensure preferred_unit_id is handled if it's not nullable and has no default in DB
            })
            .select('id')
            .single();

        if (uvInsertError) {
            logger.error("Error creating new user_variable", { error: uvInsertError, input });
            throw new Error("Database error creating user variable.");
        }
        if (!newUserVar?.id) {
            logger.error("Failed to get ID of new user_variable", { input });
            throw new Error("Failed to create user variable record.");
        }
        userVariableId = newUserVar.id;
        logger.info("Created new user_variable", { userVariableId });
    }

    // 4. Prepare data for patient_treatments insertion (now including user_variable_id)
    const treatmentData: PatientTreatmentInsert = { // Use the full Insert type
        patient_id: input.patient_id,
        treatment_id: input.treatment_id,
        user_variable_id: userVariableId, // Provide the actual ID
        status: 'active', // Set default status
        is_prescribed: false, // Default value
        // Optional fields like start_date, patient_notes can be added here if needed
    };

    // 5. Perform the insert operation (No casting needed now)
    const { data, error } = await supabase
      .from("patient_treatments")
      .insert(treatmentData)
      .select("id") // Select the ID of the newly created row
      .single(); // Expect only one row to be inserted

    // 6. Handle potential errors
    if (error) {
      logger.error("Failed to insert patient treatment", { error: error.message, input, treatmentData });
      // Check for unique constraint violation (patient_id, treatment_id)
      // Note: The unique constraint might technically be on (patient_id, user_variable_id)
      // depending on schema, but functionally it prevents duplicates for the same treatment.
      if (error.code === '23505') { 
           return { success: false, error: "This treatment is likely already tracked for this patient." };
      }
      throw new Error(error.message || "Database error occurred inserting patient treatment.");
    }
    
    if (!data?.id) {
       logger.error("Insert succeeded but no ID returned", { input });
       throw new Error("Failed to get ID of new treatment record.");
    }

    // 7. Fetch treatment name for default reminder (moved inside try block)
    const { data: treatmentDetails, error: nameError } = await supabase
      .from('global_variables')
      .select('name')
      .eq('id', input.treatment_id)
      .single();

    // 8. Create Default Reminder (Fire and Forget)
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

    // 9. Revalidate the path to update the UI
    revalidatePath("/patient/treatments"); 

    // 10. Return success
    logger.info("Successfully added patient treatment and triggered reminder creation", { newPatientTreatmentId: data.id });
    return { success: true, data: { id: data.id } };

  } catch (error) {
    logger.error("Error in addSinglePatientTreatmentAction", { error: error instanceof Error ? error.message : String(error), input });
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred." };
  }
} 