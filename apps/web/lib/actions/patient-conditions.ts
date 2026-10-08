"use server"

import { getUserDb } from '@/lib/db/server'
import { withUserTransaction } from '@/lib/db'
import { getServerUser } from '@/lib/server-auth'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
// Import reminder action for single add
import { createDefaultReminderAction } from "./reminder-schedules"

export type PatientCondition = Database['public']['Views']['patient_conditions_view']['Row']
export type PatientConditionInsert = Database['public']['Tables']['patient_conditions']['Insert']
export type PatientConditionUpdate = Database['public']['Tables']['patient_conditions']['Update']

/**
 * New patient_conditions rows need their user variable. A database trigger
 * sets user_variable_id on insert; Prisma still requires the relation, so
 * connect the same (user, condition) user variable, creating it if missing.
 */
function userVariableFor(userId: string, conditionId: string) {
  return {
    connectOrCreate: {
      where: { user_id_global_variable_id: { user_id: userId, global_variable_id: conditionId } },
      create: {
        profiles: { connect: { id: userId } },
        global_variables: { connect: { id: conditionId } },
      },
    },
  }
}

// Fields for a new patient condition with the default status and diagnosis date
function newPatientConditionData(userId: string, conditionId: string) {
  return {
    status: 'active',
    diagnosed_at: new Date(),
    patients: { connect: { id: userId } },
    global_conditions: { connect: { id: conditionId } },
    user_variables: userVariableFor(userId, conditionId),
  }
}

// Get all conditions for a patient
export async function getPatientConditionsAction(patientId: string): Promise<PatientCondition[]> {
  const db = await getUserDb()

  // Log the request details
  logger.info('Fetching patient conditions:', {
    table: 'patient_conditions_view',
    patientId,
  })

  return db.patient_conditions_view.findMany({
    where: { patient_id: patientId },
    orderBy: { diagnosed_at: 'desc' },
  })
}

// Get a specific condition by ID
export async function getPatientConditionByIdAction(id: string): Promise<PatientCondition | null> {
  const db = await getUserDb()

  return db.patient_conditions_view.findFirst({ where: { id } })
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

  const db = await getUserDb()
  logger.info("Attempting to add condition for user", { userId, conditionId })

  try {
    // Check if the patient already has this condition
    let existingCondition: { id: string } | null
    try {
      existingCondition = await db.patient_conditions.findFirst({
        where: { patient_id: userId, condition_id: conditionId },
        select: { id: true },
      })
    } catch (checkError) {
      logger.error("Error checking for existing patient condition", { userId, conditionId, error: checkError })
      // Return error object
      return { success: false, error: "Database error checking condition." }
    }

    // If the condition already exists for the patient, return success with existing data
    if (existingCondition) {
      logger.info("Patient already has condition, skipping add", { userId, conditionId })
      return { success: true, data: existingCondition, message: "Condition already exists for patient." }
    }

    // Add the new condition, returning the condition name for the default reminder
    let insertResult
    try {
      insertResult = await db.patient_conditions.create({
        data: newPatientConditionData(userId, conditionId),
        include: { global_conditions: { select: { global_variables: { select: { name: true } } } } },
      })
    } catch (insertError) {
      logger.error("Error adding patient condition", { userId, conditionId, error: insertError })
      // Return error object
      return { success: false, error: insertError instanceof Error ? insertError.message : "Database error adding condition." }
    }
    const { global_conditions: { global_variables: { name: conditionName } }, ...newPatientCondition } = insertResult

    logger.info("Successfully added patient condition", { userId, conditionId, newRecord: newPatientCondition })

    // Create Default Reminder (Fire and Forget) for the user variable of the new record
    createDefaultReminderAction(userId, newPatientCondition.user_variable_id, conditionName, 'condition')
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
  const db = await getUserDb()

  // First update the condition
  const updated = await db.patient_conditions.update({
    where: { id },
    data: { ...updates, updated_at: new Date() },
    select: { patient_id: true },
  })

  // Then fetch it from the view to get the complete data
  const condition = await db.patient_conditions_view.findFirst({ where: { id } })

  if (!condition) {
    logger.error('Updated patient condition not found in view:', { id })
    throw new Error('Failed to fetch updated patient condition')
  }

  revalidatePath(`/patient/${updated.patient_id}`)
  revalidatePath(`/patient/conditions`) // Also revalidate list if needed
  return condition
}

// Delete a patient condition
export async function deletePatientConditionAction(id: string): Promise<void> {
  const db = await getUserDb()

  // Need patient_id for revalidation before deleting
  const conditionData = await db.patient_conditions.findUnique({
    where: { id },
    select: { patient_id: true },
  });

  if (!conditionData) {
    logger.error('Error fetching patient_id before deleting condition:', { id });
    throw new Error('Failed to find condition to delete or get patient ID.');
  }

  await db.patient_conditions.deleteMany({ where: { id } })

  revalidatePath('/patient/conditions')
}

// Action for bulk-adding conditions during onboarding
export async function addInitialPatientConditionsAction(
  patientId: string,
  conditions: { id: string; name: string }[]
): Promise<{ success: boolean; error?: string }> {
  logger.info('Adding initial patient conditions', { patientId, count: conditions.length });

  if (!patientId || !conditions || conditions.length === 0) {
    logger.warn('Attempted to add initial conditions with invalid input', { patientId, conditions });
    return { success: false, error: 'Invalid input provided.' };
  }

  const user = await getServerUser();

  let insertedConditions: { condition_id: string; user_variable_id: string }[];
  try {
    // Insert all conditions in one transaction, so either all or none are saved
    insertedConditions = await withUserTransaction(user && { id: user.id, email: user.email }, async (tx) => {
      const inserted = [];
      for (const condition of conditions) {
        inserted.push(await tx.patient_conditions.create({
          data: newPatientConditionData(patientId, condition.id), // condition.id is the global condition ID
          select: { condition_id: true, user_variable_id: true },
        }));
      }
      return inserted;
    });
  } catch (error) {
    logger.error('Error inserting initial patient conditions:', {
      patientId,
      conditionIds: conditions.map(c => c.id),
      error
    });
    return { success: false, error: 'Failed to save conditions.' };
  }

  // Create default reminders for each condition
  for (const condition of conditions) {
    const insertedCondition = insertedConditions.find(ic => ic.condition_id === condition.id);
    if (insertedCondition?.user_variable_id) {
      try {
        const reminderResult = await createDefaultReminderAction(
          patientId,
          insertedCondition.user_variable_id,
          condition.name,
          'condition'
        );
        if (!reminderResult.success) {
          logger.warn('Failed to create default reminder for condition', {
            patientId,
            conditionId: condition.id,
            error: reminderResult.error
          });
        }
      } catch (err) {
        logger.error('Error creating default reminder for condition', {
          patientId,
          conditionId: condition.id,
          error: err
        });
        // Continue with other reminders even if one fails
      }
    }
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
