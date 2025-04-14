"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"
import { createDefaultReminderAction } from "./reminder-schedules"

type PatientConditionInsert = Database["public"]["Tables"]["patient_conditions"]["Insert"]

/**
 * Adds a condition to a patient's record if it doesn't already exist.
 * @param userId The ID of the user (patient).
 * @param conditionId The ID of the condition (from global_variables) to add.
 */
export async function addPatientConditionAction(userId: string, conditionId: string) {
  // Basic validation
  if (!userId || !conditionId) {
    logger.error("Missing userId or conditionId for addPatientConditionAction")
    throw new Error("User ID and Condition ID are required.")
  }

  const supabase = await createClient()
  logger.info("Attempting to add condition for user", { userId, conditionId })

  try {
    // Check if the patient already has this condition
    const { data: existingCondition, error: checkError } = await supabase
      .from("patient_conditions")
      .select("id")
      .eq("patient_id", userId)
      .eq("condition_id", conditionId)
      .maybeSingle()

    if (checkError) {
      logger.error("Error checking for existing patient condition", { userId, conditionId, error: checkError })
      throw checkError
    }

    // If the condition already exists for the patient, do nothing
    if (existingCondition) {
      logger.info("Patient already has condition, skipping add", { userId, conditionId })
      return { success: true, data: existingCondition, message: "Condition already exists for patient." }
    }

    // Add the new condition
    const insertData: PatientConditionInsert = {
      patient_id: userId,
      condition_id: conditionId,
      // Add defaults for other non-nullable fields if any, or make them nullable
      // diagnosed_at: new Date().toISOString(), // Example: Set diagnosis date to now?
      // status: 'active', // Example: Default status?
      // severity: 'mild', // Example: Default severity?
    }

    const { data: newPatientCondition, error: insertError } = await supabase
      .from("patient_conditions")
      .insert(insertData)
      .select()
      .single()

    if (insertError) {
      logger.error("Error adding patient condition", { userId, conditionId, error: insertError })
      throw insertError
    }

    logger.info("Successfully added patient condition", { userId, conditionId, newRecord: newPatientCondition })
    
    // Fetch condition name for default reminder
    const { data: conditionDetails, error: nameError } = await supabase
        .from('global_variables')
        .select('name')
        .eq('id', conditionId)
        .single();
    
    if (nameError || !conditionDetails?.name) {
      logger.warn("Could not fetch condition name for default reminder", { userId, conditionId, error: nameError });
    } else {
      // Call action to create default reminder (fire and forget, log errors)
      createDefaultReminderAction(userId, conditionId, conditionDetails.name, 'condition')
          .then(result => {
              if (!result.success) {
                  logger.error("Failed to create default reminder for new condition", { userId, conditionId, error: result.error });
              } else {
                  logger.info("Successfully created default reminder for new condition", { userId, conditionId });
              }
          })
          .catch(err => {
               logger.error("Error calling createDefaultReminderAction for condition", { userId, conditionId, error: err });
          });
    }
    
    // Revalidate relevant paths
    revalidatePath("/patient/conditions") // Or the specific page where patient conditions are listed
    revalidatePath(`/patient/treatments`) // Also revalidate treatments page as conditions might affect it

    return { success: true, data: newPatientCondition, message: "Condition added successfully." }

  } catch (error) {
    logger.error("Failed in addPatientConditionAction", { userId, conditionId, error })
    // Consider returning a more specific error structure
    return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." }
  }
} 