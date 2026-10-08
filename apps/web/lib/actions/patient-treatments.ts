"use server"

import { createClient } from '@/utils/supabase/server'
import { getUserDb } from '@/lib/db/server'
import { isUniqueViolation, withUserTransaction } from '@/lib/db'
import { getServerUser } from '@/lib/server-auth'
import type { Database } from '@/lib/database.types'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'
// Import reminder action for single add
import { createDefaultReminderAction } from "./reminder-schedules"
// Import the type needed for the detail fetch
import type { FullPatientTreatmentDetail } from "@/app/(protected)/patient/treatments/[patientTreatmentId]/treatment-detail-client";

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
  global_treatments: {
    global_variables: { name: string | null } | null
  } | null
}

// Type for treatment with ratings
export type PatientTreatmentWithRatings = PatientTreatmentWithName & {
  treatment_ratings?: {
    effectiveness_out_of_ten: number | null;
    review: string | null;
    id: string;
    patient_condition_id: string;
  }[];
}

// Removed TreatmentEntry and ConditionTreatmentState interfaces

const treatmentNameInclude = {
  global_treatments: { select: { global_variables: { select: { name: true } } } },
} as const

/**
 * Fields for a new, active, non-prescribed patient treatment starting now.
 * A database trigger sets user_variable_id on insert; Prisma still requires the
 * relation, so connect the same (user, treatment) user variable, creating it if missing.
 */
function newPatientTreatmentData(userId: string, treatmentId: string) {
  return {
    status: 'active',
    is_prescribed: false,
    start_date: new Date(),
    profiles: { connect: { id: userId } },
    global_treatments: { connect: { id: treatmentId } },
    user_variables: {
      connectOrCreate: {
        where: { user_id_global_variable_id: { user_id: userId, global_variable_id: treatmentId } },
        create: {
          profiles: { connect: { id: userId } },
          global_variables: { connect: { id: treatmentId } },
        },
      },
    },
  }
}

// --- Server Action ---

// Action to get all treatments for a patient
export async function getPatientTreatmentsAction(patientId: string): Promise<PatientTreatmentWithName[]> {
  const db = await getUserDb()
  logger.info('Fetching treatments for patient', { patientId });

  return db.patient_treatments.findMany({
    where: {
      patient_id: patientId,
      end_date: null, // Optionally filter for currently active treatments
    },
    include: treatmentNameInclude,
    orderBy: { start_date: 'desc' },
  });
}

// --- New Action to Fetch Full Patient Treatment Details ---
export async function getPatientTreatmentDetailAction(patientTreatmentId: string, userId: string): Promise<FullPatientTreatmentDetail | null> {
    const db = await getUserDb();
    logger.info('Fetching full patient treatment details', { patientTreatmentId, userId });

    try {
        return await db.patient_treatments.findFirst({
            where: { id: patientTreatmentId, patient_id: userId },
            include: {
                ...treatmentNameInclude,
                treatment_ratings: {
                    include: {
                        patient_conditions: {
                            select: {
                                id: true,
                                global_conditions: { select: { global_variables: { select: { name: true } } } },
                            },
                        },
                    },
                },
                patient_side_effects: { select: { id: true, description: true, severity_out_of_ten: true } },
            },
        });
    } catch (error) {
        logger.error("Error fetching patient treatment details", { patientTreatmentId, userId, error: error instanceof Error ? error.message : String(error) });
        return null;
    }
}
// --- End New Action ---

export async function addInitialPatientTreatmentsAction(
  userId: string,
  selectedTreatments: SelectedTreatment[] // Updated parameter type
): Promise<{ success: boolean; error?: string }> {
  logger.info('Adding initial patient treatments via trigger', { userId, count: selectedTreatments.length });

  if (!userId || !selectedTreatments || selectedTreatments.length === 0) {
    logger.warn('Attempted to add initial treatments with invalid input', { userId, selectedTreatments });
    return { success: false, error: 'Invalid input provided.' };
  }

  try {
    // 1. Insert all patient treatments in one transaction, so either all or none are saved
    const user = await getServerUser();
    const insertedPatientTreatments = await withUserTransaction(user && { id: user.id, email: user.email }, async (tx) => {
      const inserted = [];
      for (const treatment of selectedTreatments) {
        inserted.push(await tx.patient_treatments.create({
          data: newPatientTreatmentData(userId, treatment.treatmentId),
          select: { id: true, treatment_id: true, user_variable_id: true, ...treatmentNameInclude },
        }));
      }
      return inserted;
    });

    logger.info('Successfully inserted patient treatments', { userId, count: insertedPatientTreatments.length });

    // 2. Create default reminders for each treatment
    const reminderPromises = insertedPatientTreatments.map(async (pt) => {
      try {
        const reminderResult = await createDefaultReminderAction(
          userId,
          pt.user_variable_id,
          pt.global_treatments.global_variables.name,
          'treatment'
        );
        if (!reminderResult.success) {
          logger.warn('Failed to create default reminder for treatment', {
            userId,
            treatmentId: pt.treatment_id,
            error: reminderResult.error
          });
        }
      } catch (err) {
        logger.error('Error creating default reminder for treatment', {
          userId,
          treatmentId: pt.treatment_id,
          error: err
        });
      }
    });

    // Wait for all reminders to be created, but don't fail if some fail
    await Promise.allSettled(reminderPromises);

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
    }

    logger.info('Successfully added initial patient treatments and created reminders', { userId });
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

  const db = await getUserDb()

  try {
    // 3. Insert the patient treatment, returning its user variable and the treatment name
    let data;
    try {
      data = await db.patient_treatments.create({
        data: newPatientTreatmentData(input.patient_id, input.treatment_id),
        select: { id: true, user_variable_id: true, ...treatmentNameInclude },
      });
    } catch (error) {
      logger.error("Failed to insert patient treatment", { error: error instanceof Error ? error.message : String(error), input });
      // Check for unique constraint violation (patient_id, treatment_id)
      if (isUniqueViolation(error)) {
           return { success: false, error: "This treatment is likely already tracked for this patient." };
      }
      throw error;
    }

    // Destructure needed IDs after successful insert
    const newPatientTreatmentId = data.id;
    const userVariableId = data.user_variable_id;
    const treatmentName = data.global_treatments.global_variables.name;

    logger.info("Successfully inserted patient treatment", { newPatientTreatmentId, userVariableId });

    // 4. Create Default Reminder (Fire and Forget)
    createDefaultReminderAction(input.patient_id, userVariableId, treatmentName, 'treatment')
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

    // 5. Revalidate the path to update the UI
    revalidatePath("/patient/treatments");

    // 6. Return success
    logger.info("Successfully added patient treatment and triggered reminder creation", { newPatientTreatmentId });
    return { success: true, data: { id: newPatientTreatmentId } }; // Return only patient_treatment id as before

  } catch (error) {
    logger.error("Error in addSinglePatientTreatmentAction", { error: error instanceof Error ? error.message : String(error), input });
    return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred." };
  }
}

// Action to get all treatments with ratings for a patient
export async function getPatientTreatmentsWithRatingsAction(patientId: string): Promise<PatientTreatmentWithRatings[]> {
  const db = await getUserDb()
  logger.info('Fetching treatments with ratings for patient', { patientId });

  return db.patient_treatments.findMany({
    where: { patient_id: patientId },
    include: {
      ...treatmentNameInclude,
      treatment_ratings: {
        select: {
          effectiveness_out_of_ten: true,
          review: true,
          id: true,
          patient_condition_id: true,
        },
      },
    },
    orderBy: { start_date: 'desc' },
  });
}
