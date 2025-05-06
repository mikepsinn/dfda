"use server"

import { createClient } from "@/utils/supabase/server"
import { logger } from "@/lib/logger"
import type { /*Database, Tables,*/ TablesInsert, Database } from "@/lib/database.types"
import { revalidatePath } from "next/cache"
import { unstable_noStore as noStore } from 'next/cache'

// Types
export type MeasurementInsert = TablesInsert<"measurements">
export type UserVariableInsert = TablesInsert<"user_variables">
export type Measurement = Database["public"]["Tables"]["measurements"]["Row"]

// New type including the related unit data
export type MeasurementWithUnits = Measurement & {
  units: { abbreviated_name: string } | null;
}

// Input type for the action - Renamed back and added reminderNotificationId
export type LogMeasurementInput = {
    userId: string;
    globalVariableId: string; // e.g., condition ID
    value: number;
    unitId?: string | null; // Allow explicit unit, otherwise try default
    startAt?: Date | string; // Defaults to now if not provided
    notes?: string | null;
    reminderNotificationId?: string; // Optional: Link to the notification being completed
}

export type UpdateMeasurementInput = {
  measurementId: string;
  userId: string;
  value: number;
  unitId: string;
  notes?: string | null;
};

/**
 * Creates a measurement log, finding/creating the necessary user_variable record.
 * Optionally links the measurement back to a reminder notification if ID is provided.
 */
// Renamed function back to logMeasurementAction
export async function logMeasurementAction(
    input: LogMeasurementInput
): Promise<{ success: boolean; error?: string; data?: { id: string } /* Return only ID */ }> {
    logger.info("SERVER ACTION: logMeasurementAction started");
    const supabase = await createClient()
    logger.info("Logging measurement", { input });

    const { userId, globalVariableId, value, unitId: inputUnitId, startAt, notes, reminderNotificationId } = input;

    // --- Validation --- 
    if (!userId || !globalVariableId) {
        return { success: false, error: "User ID and Global Variable ID are required." };
    }
    if (value === undefined || value === null) {
        return { success: false, error: "Measurement value is required." };
    }

    try {
        // --- 1. Find or Create User Variable --- 
        let userVariableId: string;
        let resolvedUnitId: string | null = inputUnitId || null;

        const { data: existingUserVar, error: uvFindError } = await supabase
            .from('user_variables')
            .select('id, preferred_unit_id, global_variables(default_unit_id)')
            .eq('user_id', userId)
            .eq('global_variable_id', globalVariableId)
            .maybeSingle();

        if (uvFindError) {
            logger.error("Error finding user_variable", { userId, globalVariableId, error: uvFindError });
            throw uvFindError;
        }

        if (existingUserVar) {
            userVariableId = existingUserVar.id;
            logger.info("Found existing user_variable", { userVariableId });
            if (!resolvedUnitId) {
                resolvedUnitId = existingUserVar.preferred_unit_id || existingUserVar.global_variables?.default_unit_id || null;
            }
        } else {
            logger.info("No existing user_variable found, creating new one", { userId, globalVariableId });
            let defaultUnitId: string | null = null;
            if (!resolvedUnitId) {
                const { data: gvData, error: gvError } = await supabase
                    .from('global_variables')
                    .select('default_unit_id')
                    .eq('id', globalVariableId)
                    .single();
                if (gvError) {
                    logger.warn("Could not fetch global variable to get default unit ID", { globalVariableId, error: gvError });
                } else {
                    defaultUnitId = gvData?.default_unit_id || null;
                    resolvedUnitId = defaultUnitId;
                }
            }
            
            const newUserVar: UserVariableInsert = {
                user_id: userId,
                global_variable_id: globalVariableId,
                preferred_unit_id: defaultUnitId 
            };
            const { data: createdUserVar, error: uvCreateError } = await supabase
                .from('user_variables')
                .insert(newUserVar)
                .select('id')
                .single();

            if (uvCreateError || !createdUserVar) {
                logger.error("Error creating user_variable", { userId, globalVariableId, error: uvCreateError });
                throw uvCreateError || new Error("Failed to create user variable link.");
            }
            userVariableId = createdUserVar.id;
            logger.info("Created new user_variable", { userVariableId });
        }

        // --- Unit Check --- 
        if (!resolvedUnitId) {
            logger.error("Could not resolve a unit ID for the measurement", { userId, globalVariableId, userVariableId });
            return { success: false, error: "Measurement unit could not be determined. Please ensure the variable has a default unit or provide one." };
        }
        logger.info("Using resolved unit ID for measurement", { resolvedUnitId });

        // --- 2. Prepare Measurement Data --- 
        const measurementData: MeasurementInsert = {
            user_id: userId,
            global_variable_id: globalVariableId,
            user_variable_id: userVariableId,
            value: value,
            unit_id: resolvedUnitId,
            start_at: startAt ? new Date(startAt).toISOString() : new Date().toISOString(),
            notes: notes || null,
        };

        // --- 3. Insert Measurement --- 
        const { data: newMeasurement, error: measurementError } = await supabase
            .from('measurements')
            .insert(measurementData)
            .select('id') // Only select ID here
            .single();

        if (measurementError) {
            logger.error("Error inserting measurement", { error: measurementError, measurementData });
            throw measurementError;
        }
        if (!newMeasurement?.id) {
             logger.error("Measurement insert succeeded but no ID returned", { input });
             throw new Error("Failed to get ID of new measurement record.");
        }

        const measurementId = newMeasurement.id;
        logger.info("Successfully logged measurement", { measurementId, userId });

        // --- 4. (Optional) Link measurement back to notification --- 
        if (reminderNotificationId) {
            logger.info("Linking measurement to reminder notification", { measurementId, reminderNotificationId });
            const { error: updateNotifError } = await supabase
                .from('reminder_notifications')
                 // Update status and details. Assumes completeReminderNotificationAction does similar.
                .update({ 
                    log_details: { measurementId: measurementId },
                    status: 'completed', 
                    completed_or_skipped_at: new Date().toISOString()
                 })
                .eq('id', reminderNotificationId)
                .eq('user_id', userId)
                .eq('status', 'pending'); // Only update pending
            
            if (updateNotifError) {
                // Log warning but don't fail the whole action
                logger.warn("Failed to link measurement and update notification status", { measurementId, notificationId: reminderNotificationId, error: updateNotifError });
            } else {
                 logger.info("Successfully linked measurement and updated notification status", { measurementId, reminderNotificationId });
            }
        }

        // --- 5. Revalidate Paths --- 
        revalidatePath(`/patient/conditions/${globalVariableId}`);
        revalidatePath(`/patient/dashboard`); 
        revalidatePath(`/components/patient/TrackingInbox`); // Revalidate inbox

        // Return only the ID as per original function signature used elsewhere
        return { success: true, data: { id: measurementId } };

    } catch (error) {
        logger.error("Failed in logMeasurementAction", { input, error: error instanceof Error ? error.message : String(error) });
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

/**
 * Fetches all measurements for a specific user variable, ordered by start time descending.
 */
export async function getMeasurementsForUserVariableAction(
    userVariableId: string, 
    userId: string,
    limit: number = 50 // Default limit, adjust as needed
): Promise<{ success: boolean; data?: Measurement[]; error?: string }> {
    noStore();
    logger.info("getMeasurementsForUserVariableAction: Called", { userVariableId, userId, limit });

    if (!userVariableId || !userId) {
        logger.warn("getMeasurementsForUserVariableAction: Missing IDs");
        return { success: false, error: "Invalid request parameters." };
    }

    try {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from("measurements")
            .select("*, units ( abbreviated_name )") // Select all measurement fields + unit name
            .eq("user_variable_id", userVariableId)
            .eq("user_id", userId)
            .is("deleted_at", null)
            .order("start_at", { ascending: false })
            .limit(limit);

        if (error) {
            logger.error("getMeasurementsForUserVariableAction: Error fetching measurements", { userId, userVariableId, error });
            return { success: false, error: error.message };
        }

        logger.info("getMeasurementsForUserVariableAction: Fetched measurements successfully", { userId, userVariableId, count: data?.length ?? 0 });
        return { success: true, data: data || [] };

    } catch (error: any) {
        logger.error("getMeasurementsForUserVariableAction: Unhandled error", { userId, userVariableId, error });
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function updateMeasurementAction(
  input: UpdateMeasurementInput
): Promise<{ success: boolean; error?: string }> {
  const { measurementId, userId, value, unitId, notes } = input;
  const supabase = await createClient();

  const { error } = await supabase
    .from("measurements")
    .update({
      value,
      unit_id: unitId,
      notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", measurementId)
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    logger.error("Failed to update measurement", { measurementId, userId, error });
    return { success: false, error: error.message };
  }

  // Optionally revalidate relevant paths here

  return { success: true };
} 