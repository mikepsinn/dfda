"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
import type { PatientConditionClientInsert } from '@/lib/database.types.custom'
// Import reminder action for single add
import { createDefaultReminderAction } from "./reminder-schedules"

export type PatientCondition = Database['public']['Views']['patient_conditions_view']['Row']
export type PatientConditionInsert = Database['public']['Tables']['patient_conditions']['Insert']
export type PatientConditionUpdate = Database['public']['Tables']['patient_conditions']['Update']

// Get all conditions for a patient
export async function getPatientConditionsAction(patientId: string): Promise<PatientCondition[]> {
  const supabase = await createClient()

  // Log the request details
  logger.info('Fetching patient conditions:', {
    table: 'patient_conditions_view',
    patientId,
    url: process.env.NEXT_PUBLIC_SUPABASE_URL
  })

  const response = await supabase
    .from('patient_conditions_view')
    .select('*')
    .eq('patient_id', patientId)
    .order('diagnosed_at', { ascending: false })

  if (response.error) {
    logger.error('Error fetching patient conditions:', { 
      error: response.error,
      status: response.status,
      statusText: response.statusText
    })
    throw new Error('Failed to fetch patient conditions')
  }

  return response.data
}

// Get a specific condition by ID
export async function getPatientConditionByIdAction(id: string): Promise<PatientCondition | null> {
  const supabase = await createClient()

  const response = await supabase
    .from('patient_conditions_view')
    .select('*')
    .eq('id', id)
    .single()

  if (response.error) {
    logger.error('Error fetching patient condition:', { error: response.error })
    throw new Error('Failed to fetch patient condition')
  }

  return response.data
}

/**
 * Adds a condition to a patient's record if it doesn't already exist.
 * Handles existence check, insertion, and default reminder creation.
 * @param userId The ID of the user (patient).
 * @param conditionId The ID of the condition (from global_variables) to add.
 */
export async function addPatientConditionAction(
    userId: string, 
    conditionId: string
): Promise<{ success: boolean; error?: string; data?: any; message?: string }> {
  // Logic from app/actions/patientConditions.ts
  // Basic validation
  if (!userId || !conditionId) {
    logger.error("Missing userId or conditionId for addPatientConditionAction")
    // Return error object instead of throwing for actions called by components
    return { success: false, error: "User ID and Condition ID are required." }
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
      // Return error object
      return { success: false, error: "Database error checking condition." }
    }

    // If the condition already exists for the patient, return success with existing data
    if (existingCondition) {
      logger.info("Patient already has condition, skipping add", { userId, conditionId })
      return { success: true, data: existingCondition, message: "Condition already exists for patient." }
    }

    // Add the new condition
    // Define data using the client-specific type
    const insertData: PatientConditionClientInsert = {
      patient_id: userId,
      condition_id: conditionId,
      // Ensure required fields have defaults or are handled
      status: 'active', // Example default
      diagnosed_at: new Date().toISOString(), // Example default
    }

    // Use .select().single() to get the newly inserted record, including DB-generated fields
    const { data: newPatientCondition, error: insertError } = await supabase
      .from("patient_conditions")
      .insert(insertData as PatientConditionInsert) // Cast to full type for insert
      .select() // Select all columns of the new row
      .single() // Expect one row

    if (insertError || !newPatientCondition) {
      logger.error("Error adding patient condition", { userId, conditionId, error: insertError })
      // Return error object
       return { success: false, error: insertError?.message || "Database error adding condition." }
    }

    logger.info("Successfully added patient condition", { userId, conditionId, newRecord: newPatientCondition })
    
    // Fetch condition name for default reminder
    // Using newPatientCondition.condition_id which is guaranteed to be the correct one
    const { data: conditionDetails, error: nameError } = await supabase
        .from('global_variables')
        .select('name')
        .eq('id', newPatientCondition.condition_id)
        .single();
    
    // Create Default Reminder (Fire and Forget)
    if (nameError || !conditionDetails?.name) {
      logger.warn("Could not fetch condition name for default reminder", { userId, conditionId: newPatientCondition.condition_id, error: nameError });
    } else {
      // Pass user_variable_id from the newly inserted record to the reminder action
       if (!newPatientCondition.user_variable_id) {
          logger.error("user_variable_id missing after insert, cannot create reminder", { newRecord: newPatientCondition });
       } else {
          createDefaultReminderAction(userId, newPatientCondition.user_variable_id, conditionDetails.name, 'condition')
              .then(result => {
                  if (!result.success) {
                      logger.error("Failed to create default reminder for new condition", { userId, conditionId: newPatientCondition.condition_id, userVariableId: newPatientCondition.user_variable_id, error: result.error });
                  } else {
                      logger.info("Successfully triggered default reminder creation for new condition", { userId, conditionId: newPatientCondition.condition_id, userVariableId: newPatientCondition.user_variable_id });
                  }
              })
              .catch(err => {
                   logger.error("Error calling createDefaultReminderAction for condition", { userId, conditionId: newPatientCondition.condition_id, userVariableId: newPatientCondition.user_variable_id, error: err });
              });
       }
    }
    
    // Revalidate relevant paths
    try {
      revalidatePath("/patient/conditions") // Or the specific page where patient conditions are listed
      revalidatePath(`/patient/${userId}`) // Revalidate patient dashboard
      revalidatePath(`/patient/treatments`) // Also revalidate treatments page as conditions might affect it
    } catch (revalError) {
       logger.error("Error during revalidation after condition add", { revalError, userId, conditionId: newPatientCondition.condition_id });
    }

    return { success: true, data: newPatientCondition, message: "Condition added successfully." }

  } catch (error) {
    logger.error("Failed in addPatientConditionAction catch block", { userId, conditionId, error })
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred." }
  }
}

// Update a patient condition
export async function updatePatientConditionAction(id: string, updates: PatientConditionUpdate): Promise<PatientCondition> {
  const supabase = await createClient()

  // First update the condition
  const updateResponse = await supabase
    .from('patient_conditions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (updateResponse.error) {
    logger.error('Error updating patient condition:', { error: updateResponse.error })
    throw new Error('Failed to update patient condition')
  }

  // Then fetch it from the view to get the complete data
  const viewResponse = await supabase
    .from('patient_conditions_view')
    .select('*')
    .eq('id', id)
    .single()

  if (viewResponse.error) {
    logger.error('Error fetching updated patient condition:', { error: viewResponse.error })
    throw new Error('Failed to fetch updated patient condition')
  }

  revalidatePath(`/patient/${updateResponse.data.patient_id}`) 
  revalidatePath(`/patient/conditions`) // Also revalidate list if needed
  return viewResponse.data
}

// Delete a patient condition
export async function deletePatientConditionAction(id: string): Promise<void> {
  const supabase = await createClient()

  // Need patient_id for revalidation before deleting
  const { data: conditionData, error: fetchError } = await supabase
    .from('patient_conditions')
    .select('patient_id')
    .eq('id', id)
    .single();

  if (fetchError || !conditionData) {
    logger.error('Error fetching patient_id before deleting condition:', { id, error: fetchError });
    throw new Error('Failed to find condition to delete or get patient ID.');
  }

  const response = await supabase
    .from('patient_conditions')
    .delete()
    .eq('id', id)

  if (response.error) {
    logger.error('Error deleting patient condition:', { id, error: response.error })
    throw new Error('Failed to delete patient condition')
  }

  revalidatePath('/patient/conditions')
}

// Action for bulk-adding conditions during onboarding
export async function addInitialPatientConditionsAction(
  patientId: string, 
  conditions: { id: string; name: string }[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  logger.info('Adding initial patient conditions', { patientId, count: conditions.length });

  if (!patientId || !conditions || conditions.length === 0) {
    logger.warn('Attempted to add initial conditions with invalid input', { patientId, conditions });
    return { success: false, error: 'Invalid input provided.' };
  }

  // No explicit type here, let TS infer
  const conditionsToInsert = conditions.map(c => ({
    patient_id: patientId,
    condition_id: c.id, // This is the global condition ID
    // You might want default values or nulls here depending on your table definition
    status: 'active', // Default status
    diagnosed_at: new Date().toISOString(), // Default diagnosed date
    // user_variable_id is intentionally omitted, handled by trigger
  }));

  const { error } = await supabase
    .from('patient_conditions')
    // Cast to PatientConditionInsert[], assuming the trigger handles user_variable_id
    .insert(conditionsToInsert as PatientConditionInsert[]);

  if (error) {
    logger.error('Error inserting initial patient conditions:', { 
      patientId, 
      conditionIds: conditions.map(c => c.id),
      error 
    });
    return { success: false, error: 'Failed to save conditions.' };
  }

  // Revalidate relevant paths after successful insertion
  try {
    revalidatePath(`/patient/${patientId}`); // Revalidate the main patient dashboard
    revalidatePath(`/patient/conditions`); // Revalidate the conditions list page
  } catch (revalError) {
    logger.error('Error during revalidation after initial condition add', { revalError, patientId });
    // Don't fail the whole operation for a revalidation error
  }

  logger.info('Successfully added initial patient conditions', { patientId, count: conditions.length });
  return { success: true };
} 