"use server"

import { getUserDb } from "@/lib/db/server"
import { logger } from "@/lib/logger"
import type { TablesInsert, Database } from "@/lib/database.types"
import { revalidatePath } from "next/cache"
import { unstable_noStore as noStore } from 'next/cache'
import { startOfDay, endOfDay } from 'date-fns';
import type { MeasurementCardData } from '@/components/measurement-card';

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
        const db = await getUserDb();
        // --- 1. Find or Create User Variable --- 
        let userVariableId: string;
        let resolvedUnitId: string | null = inputUnitId || null;

        const existingUserVar = await db.user_variables.findUnique({
            where: { user_id_global_variable_id: { user_id: userId, global_variable_id: globalVariableId } },
            select: { id: true, preferred_unit_id: true, global_variables: { select: { default_unit_id: true } } },
        });

        if (existingUserVar) {
            userVariableId = existingUserVar.id;
            logger.info("Found existing user_variable", { userVariableId });
            if (!resolvedUnitId) {
                resolvedUnitId = existingUserVar.preferred_unit_id || existingUserVar.global_variables.default_unit_id || null;
            }
        } else {
            logger.info("No existing user_variable found, creating new one", { userId, globalVariableId });
            let defaultUnitId: string | null = null;
            if (!resolvedUnitId) {
                const gvData = await db.global_variables.findUnique({
                    where: { id: globalVariableId },
                    select: { default_unit_id: true },
                });
                if (!gvData) {
                    logger.warn("Could not fetch global variable to get default unit ID", { globalVariableId });
                } else {
                    defaultUnitId = gvData.default_unit_id || null;
                    resolvedUnitId = defaultUnitId;
                }
            }
            
            const newUserVar: UserVariableInsert = {
                user_id: userId,
                global_variable_id: globalVariableId,
                preferred_unit_id: defaultUnitId 
            };
            const createdUserVar = await db.user_variables.create({
                data: newUserVar,
                select: { id: true },
            });
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
            start_at: startAt ? new Date(startAt) : new Date(),
            notes: notes || null,
        };

        // --- 3. Insert Measurement --- 
        const newMeasurement = await db.measurements.create({
            data: measurementData,
            select: { id: true }, // Only select ID here
        });

        const measurementId = newMeasurement.id;
        logger.info("Successfully logged measurement", { measurementId, userId });

        // --- 4. (Optional) Link measurement back to notification --- 
        if (reminderNotificationId) {
            logger.info("Linking measurement to reminder notification", { measurementId, reminderNotificationId });
            try {
                // Update status and details. Assumes completeReminderNotificationAction does similar.
                await db.reminder_notifications.updateMany({
                    where: {
                        id: reminderNotificationId,
                        user_id: userId,
                        status: 'pending', // Only update pending
                    },
                    data: {
                        log_details: { measurementId: measurementId },
                        status: 'completed',
                        completed_or_skipped_at: new Date(),
                    },
                });
                logger.info("Successfully linked measurement and updated notification status", { measurementId, reminderNotificationId });
            } catch (updateNotifError) {
                // Log warning but don't fail the whole action
                logger.warn("Failed to link measurement and update notification status", { measurementId, notificationId: reminderNotificationId, error: updateNotifError });
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
        const db = await getUserDb();
        const data = await db.measurements.findMany({
            where: {
                user_variable_id: userVariableId,
                user_id: userId,
                deleted_at: null,
            },
            include: { units: { select: { abbreviated_name: true } } }, // All measurement fields + unit name
            orderBy: { start_at: "desc" },
            take: limit,
        });

        logger.info("getMeasurementsForUserVariableAction: Fetched measurements successfully", { userId, userVariableId, count: data.length });
        return { success: true, data };

    } catch (error) {
        logger.error("getMeasurementsForUserVariableAction: Error fetching measurements", { userId, userVariableId, error });
        return { success: false, error: "An unexpected error occurred." };
    }
}

export async function updateMeasurementAction(
  input: UpdateMeasurementInput
): Promise<{ success: boolean; error?: string }> {
  const { measurementId, userId, value, unitId, notes } = input;

  try {
    const db = await getUserDb();
    await db.measurements.updateMany({
      where: {
        id: measurementId,
        user_id: userId,
        deleted_at: null,
      },
      data: {
        value,
        unit_id: unitId,
        notes: notes ?? null,
        updated_at: new Date(),
      },
    });
  } catch (error) {
    logger.error("Failed to update measurement", { measurementId, userId, error });
    return { success: false, error: "Could not update the measurement." };
  }

  // Optionally revalidate relevant paths here

  return { success: true };
}

/**
 * Fetches raw measurements for a specific user and date to populate the timeline.
 */
export async function getMeasurementsForDateAction(
    userId: string,
    targetDate: Date
): Promise<{ success: boolean; data?: MeasurementCardData[]; error?: string }> {
    noStore(); // Ensure this doesn't get cached inappropriately
    const dateStr = targetDate.toISOString().split('T')[0];
    logger.info('Fetching measurements for date', { userId, date: dateStr });

    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Fetch measurements for the target date range and join related data
    let measurements;
    try {
        const db = await getUserDb();
        measurements = await db.measurements.findMany({
            where: {
                user_id: userId,
                start_at: { gte: dayStart, lt: dayEnd },
                user_variables: { isNot: null },
            },
            orderBy: { start_at: 'asc' },
            select: {
                id: true,
                value: true,
                unit_id: true,
                notes: true,
                start_at: true,
                end_at: true,
                user_variable_id: true,
                units: { select: { id: true, abbreviated_name: true, name: true } },
                user_variables: {
                    select: {
                        id: true,
                        global_variable_id: true,
                        preferred_unit_id: true,
                        global_variables: {
                            select: {
                                id: true,
                                name: true,
                                variable_category_id: true,
                                description: true,
                                emoji: true,
                                default_unit_id: true,
                                variable_categories: { select: { id: true, name: true } },
                            },
                        },
                    },
                },
            },
        });
    } catch (error) {
        logger.error('Error fetching measurements for date', { userId, date: dateStr, error });
        return { success: false, error: 'Database error fetching measurements.' };
    }

    // Map to the MeasurementCardData structure
    const measurementCardDataItems: MeasurementCardData[] = measurements.map((measurement): MeasurementCardData | null => {
        const userVar = measurement.user_variables;
        const unit = measurement.units;

        if (!userVar) {
            logger.warn("Missing user variable for measurement card data, skipping", { measurementId: measurement.id });
            return null; 
        }
        const globalVar = userVar.global_variables;
        const category = globalVar.variable_categories;

        const variableCategoryId = category.id as MeasurementCardData['variableCategoryId'];

        return {
            id: measurement.id,
            globalVariableId: globalVar.id,
            userVariableId: userVar.id,
            variableCategoryId: variableCategoryId,
            name: globalVar.name,
            start_at: measurement.start_at.toISOString(),
            end_at: measurement.end_at?.toISOString() ?? undefined,
            value: measurement.value,
            unit: unit.abbreviated_name,
            unitId: unit.id,
            unitName: unit.name,
            notes: measurement.notes ?? undefined,
            emoji: globalVar.emoji,
            isEditable: true, 
        };
    }).filter((item): item is MeasurementCardData => item !== null);

    logger.info(`Found and mapped ${measurementCardDataItems.length} measurement card data items for date`, { userId, date: dateStr });
    return { success: true, data: measurementCardDataItems };
}