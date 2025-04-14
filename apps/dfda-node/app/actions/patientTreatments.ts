"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import { revalidatePath } from "next/cache"
import type { Database } from "@/lib/database.types"

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

  // 3. Prepare data for insertion
  // The trigger 'ensure_user_variable_for_treatment' should handle creating
  // the user_variable record and setting the user_variable_id column.
  // We only need to provide patient_id and treatment_id here.
  // Set default status to 'active'.
  const treatmentData: Omit<PatientTreatmentInsert, 'user_variable_id' | 'id'> = {
      patient_id: input.patient_id,
      treatment_id: input.treatment_id,
      status: 'active', // Set a default status
      // start_date: new Date().toISOString(), // Optionally set start date to now
      is_prescribed: false, // Default value
  };

  // 4. Perform the insert operation
  const { data, error } = await supabase
    .from("patient_treatments")
    .insert(treatmentData)
    .select("id") // Select the ID of the newly created row
    .single(); // Expect only one row to be inserted

  // 5. Handle potential errors
  if (error) {
    logger.error("Failed to insert patient treatment", { error: error.message, input });
    // Check for unique constraint violation (e.g., trigger failure?)
    if (error.code === '23505') { // Unique violation code
         return { success: false, error: "This treatment is likely already tracked." };
    }
    return { success: false, error: error.message || "Database error occurred." };
  }
  
  if (!data?.id) {
     logger.error("Insert succeeded but no ID returned", { input });
     return { success: false, error: "Failed to get ID of new treatment record." };
  }

  // 6. Revalidate the path to update the UI
  revalidatePath("/patient/treatments"); 

  // 7. Return success
  logger.info("Successfully added patient treatment", { newPatientTreatmentId: data.id });
  return { success: true, data: { id: data.id } };
} 