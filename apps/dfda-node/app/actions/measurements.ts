"use server"

import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"
import type { Database } from "@/lib/database.types"
import { revalidatePath } from "next/cache"

interface LogMeasurementInput {
    userId: string;
    userVariableId: string; 
    globalVariableId: string; // We need this to link back
    value: number;
    unitId?: string; // Optional: If not provided, try to use default or fail
    notes?: string; // Optional notes
    startAt?: string; // Optional timestamp, defaults to now
    reminderNotificationId?: string; // Optional: Link to the notification being completed
}

export async function logMeasurementAction(input: LogMeasurementInput): Promise<{ success: boolean; error?: string; data?: { id: string }}> {
    
    const supabase = await createClient();
    logger.info("Attempting to log measurement", { input });

    // Basic validation
    if (!input.userId || !input.userVariableId || !input.globalVariableId || input.value === null || input.value === undefined) {
        logger.error("Missing required fields for logMeasurementAction", { input });
        return { success: false, error: "Missing required measurement information." };
    }

    try {
        // 1. Determine the unit ID to use
        let unitToUse: string | null = input.unitId || null;

        // If no unit ID provided, fetch the default unit for the global variable
        if (!unitToUse) {
            const { data: globalVar, error: gvError } = await supabase
                .from('global_variables')
                .select('default_unit_id')
                .eq('id', input.globalVariableId)
                .single();
            
            if (gvError) {
                logger.warn("Could not fetch default unit for global variable", { globalVariableId: input.globalVariableId, error: gvError });
                // Decide if this is a hard error or if we proceed without a unit (might violate constraints)
                // For now, let's make it an error if no unit is specified AND no default exists
            }
            if (globalVar?.default_unit_id) {
                unitToUse = globalVar.default_unit_id;
                logger.info("Using default unit for measurement", { unitId: unitToUse });
            } else if (!input.unitId) {
                 logger.error("No unit ID provided and no default unit found for global variable", { globalVariableId: input.globalVariableId });
                 return { success: false, error: "Measurement unit could not be determined." };
            }
        }
        
        if (!unitToUse) {
             // This case should theoretically be caught above, but as a safeguard:
             logger.error("Unit ID is null after checks", { input });
             return { success: false, error: "Failed to determine measurement unit." };
        }

        // 2. Prepare data for insertion
        const measurementData: Database["public"]["Tables"]["measurements"]["Insert"] = {
            user_id: input.userId,
            user_variable_id: input.userVariableId,
            global_variable_id: input.globalVariableId,
            value: input.value,
            unit_id: unitToUse, // Use the determined unit ID
            start_at: input.startAt || new Date().toISOString(), // Default to now
            notes: input.notes,
        };

        // 3. Perform insert
        const { data, error } = await supabase
            .from("measurements")
            .insert(measurementData)
            .select("id")
            .single();

        // 4. Handle result
        if (error) {
            logger.error("Failed to insert measurement", { error: error.message, input });
            return { success: false, error: error.message || "Database error occurred." };
        }

        const measurementId = data?.id;
        if (!measurementId) {
            logger.error("Measurement insert succeeded but no ID returned", { input });
            return { success: false, error: "Failed to get ID of new measurement record." };
        }

        logger.info("Successfully logged measurement", { measurementId, userId: input.userId });

        // 5. (Optional) Link measurement back to the notification if ID provided
        if (input.reminderNotificationId) {
            const { error: updateNotifError } = await supabase
                .from('reminder_notifications')
                .update({ log_details: { measurementId: measurementId } })
                .eq('id', input.reminderNotificationId)
                .eq('user_id', input.userId);
            if (updateNotifError) {
                // Log warning but don't fail the whole action
                logger.warn("Failed to link measurement to notification", { measurementId, notificationId: input.reminderNotificationId, error: updateNotifError });
            }
        }

        // 6. Revalidate relevant paths
        revalidatePath("/patient/dashboard"); // Example path, adjust as needed
        revalidatePath("/patient/measurements"); 
        revalidatePath("/components/patient/TrackingInbox");

        return { success: true, data: { id: measurementId } };

    } catch (error) {
        logger.error("Error in logMeasurementAction", { error: error instanceof Error ? error.message : String(error), input });
        return { success: false, error: error instanceof Error ? error.message : "An unexpected error occurred." };
    }
} 