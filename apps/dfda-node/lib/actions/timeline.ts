"use server"

import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
// Remove unused type import
// import type { Database } from "@/lib/database.types"; 
import { unstable_noStore as noStore } from 'next/cache';
import { startOfDay, endOfDay, parseISO, isValid } from 'date-fns';

// Import relevant types from other actions
// Removed unused imports
// import type { ReminderSchedule } from "./reminder-schedules"; 
// import { ReminderNotification } from "@/lib/actions/reminder-schedules"; // Removed

// Adjusted ReminderNotification Type
// Define the specific structure needed for timeline items, derived from different sources
export type TimelineItemBase = {
    id: string; 
    type: 'measurement' | 'reminder';
    timestamp: string; 
    status: 'recorded' | 'pending' | 'completed' | 'skipped';
    userVariableId: string;
    globalVariableId: string;
    variableName: string;
    variableEmoji: string | null;
    unitName: string | null;
    measurementValue?: number | null;
    measurementNotes?: string | null;
    reminderScheduleId?: string | null;
    reminderNotificationId?: string | null; 
    reminderDefaultValue?: number | null;
};

/**
 * Fetches and combines measurements and reminder notifications for a given set of user variables on a specific date.
 */
export async function getDailyTimelineItemsAction(
    userId: string,
    userVariableIds: string[],
    targetDate: string // Expecting YYYY-MM-DD string
): Promise<{ success: boolean; data?: TimelineItemBase[]; error?: string }> {
    noStore();
    logger.info("getDailyTimelineItemsAction: Called", { userId, userVariableIds, targetDate });

    if (!userId || !userVariableIds || userVariableIds.length === 0 || !targetDate) {
        logger.warn("getDailyTimelineItemsAction: Missing required parameters");
        return { success: false, error: "Invalid request parameters." };
    }

    let parsedDate = parseISO(targetDate);
    if (!isValid(parsedDate)) {
        logger.warn("getDailyTimelineItemsAction: Invalid date format", { targetDate });
         // Fallback to today if parsing fails
         parsedDate = new Date(); 
    }

    const dateStart = startOfDay(parsedDate).toISOString();
    const dateEnd = endOfDay(parsedDate).toISOString();

    logger.info("getDailyTimelineItemsAction: Date range", { dateStart, dateEnd });

    try {
        const supabase = await createClient();

        // --- Step 1: Fetch relevant reminder schedule IDs --- 
        const { data: scheduleIdsData, error: scheduleIdsError } = await supabase
            .from("reminder_schedules")
            .select("id, user_variable_id") // Select schedule ID and the user_variable_id it belongs to
            .eq("user_id", userId)
            .in("user_variable_id", userVariableIds);
        
        if (scheduleIdsError) {
            logger.error("getDailyTimelineItemsAction: Error fetching schedule IDs", { userId, error: scheduleIdsError });
            return { success: false, error: `Failed to fetch schedule IDs: ${scheduleIdsError.message}` };
        }

        const scheduleIds = scheduleIdsData?.map(s => s.id) || [];
        // Map schedule ID back to user variable ID for later use
        const scheduleIdToUserVariableIdMap = new Map(scheduleIdsData?.map(s => [s.id, s.user_variable_id]));

        if (scheduleIds.length === 0) {
             logger.info("getDailyTimelineItemsAction: No relevant schedules found for these variables.", { userId, userVariableIds });
             // Proceed without notifications if no schedules exist
        }

        // --- Step 2: Fetch Measurements, Notifications (using schedule IDs), and Variable Details --- 
        const [measurementsResult, notificationsResult, userVariableDetailsResult] = await Promise.all([
            // 1. Fetch Measurements (same as before)
            supabase
                .from("measurements")
                .select(`*,
                         units(abbreviated_name),
                         user_variables!inner(id, global_variable_id, global_variables(name, emoji))
                       `)
                .eq("user_id", userId)
                .in("user_variable_id", userVariableIds)
                .gte("start_at", dateStart)
                .lte("start_at", dateEnd)
                .is("deleted_at", null)
                .order("start_at", { ascending: true }),

            // 2. Fetch Reminder Notifications using reminder_schedule_ids
            scheduleIds.length > 0 ? supabase
                .from("reminder_notifications")
                .select(`*,
                         reminder_schedules ( default_value )
                        `)
                .eq("user_id", userId)
                .in("reminder_schedule_id", scheduleIds) // Use reminder_schedule_id here
                .gte("notification_trigger_at", dateStart)
                .lte("notification_trigger_at", dateEnd)
                .order("notification_trigger_at", { ascending: true })
            : Promise.resolve({ data: [], error: null }), 
            
            // 3. Fetch User Variable Details (same as before)
             supabase
                .from("user_variables")
                .select(`id, global_variable_id, units:preferred_unit_id(abbreviated_name),
                         global_variables!inner(name, emoji, units:default_unit_id(abbreviated_name))
                        `)
                .in("id", userVariableIds)
                .eq("user_id", userId)

        ]);

        // Error check fetches...
         if (measurementsResult.error) {
            logger.error("getDailyTimelineItemsAction: Error fetching measurements", { userId, error: measurementsResult.error });
            // Allow partial results for now, return error if critical
            // return { success: false, error: `Failed to fetch measurements: ${measurementsResult.error.message}` };
        }
         if (notificationsResult.error) {
            logger.error("getDailyTimelineItemsAction: Error fetching reminder notifications", { userId, error: notificationsResult.error });
             // Allow partial results for now, return error if critical
            // return { success: false, error: `Failed to fetch notifications: ${notificationsResult.error.message}` };
        }
         if (userVariableDetailsResult.error) {
             logger.error("getDailyTimelineItemsAction: Failed to fetch necessary user variable details", { userId, error: userVariableDetailsResult.error });
             return { success: false, error: `Failed to fetch variable details: ${userVariableDetailsResult.error.message}` };
         }

        const measurements = measurementsResult.data || [];
        const notifications = notificationsResult.data || [];
        const userVariableDetails = userVariableDetailsResult.data || [];

        // Create a map for quick lookup of variable details
        const variableDetailsMap = new Map(userVariableDetails.map(uv => [
            uv.id, 
            {
                name: uv.global_variables?.name ?? 'Unknown Variable',
                emoji: uv.global_variables?.emoji ?? null,
                global_id: uv.global_variable_id,
                unit_name: uv.units?.abbreviated_name ?? uv.global_variables?.units?.abbreviated_name ?? null
            }
        ]));

        logger.info("getDailyTimelineItemsAction: Raw data fetched", { measurementsCount: measurements.length, notificationsCount: notifications.length, detailsCount: userVariableDetails.length });

        // --- Merge Logic --- 
        const timelineItems: TimelineItemBase[] = [];
        const completedMeasurementIds = new Set<string>();

        // Identify measurements linked from completed/skipped notifications
        for (const n of notifications) {
            if ((n.status === 'completed' || n.status === 'skipped') && n.log_details) {
                 const logDetails = n.log_details as any;
                 if (logDetails.measurementId && typeof logDetails.measurementId === 'string') {
                    completedMeasurementIds.add(logDetails.measurementId);
                 }
            }
        }

        // Process measurements first
        for (const m of measurements) {
            if (!m.user_variables || !m.user_variable_id) continue; 
            // Skip if this measurement was logged via a notification completion
            if (completedMeasurementIds.has(m.id)) continue;

            const details = variableDetailsMap.get(m.user_variable_id);
            timelineItems.push({
                id: m.id,
                type: 'measurement',
                timestamp: m.start_at,
                status: 'recorded',
                userVariableId: m.user_variable_id, 
                globalVariableId: details?.global_id ?? 'unknown', // Get global ID from map
                variableName: details?.name ?? 'Unknown Variable',
                variableEmoji: details?.emoji ?? null,
                unitName: details?.unit_name ?? m.units?.abbreviated_name ?? null,
                measurementValue: m.value,
                measurementNotes: m.notes,
            });
        }

        // Process notifications
        for (const n of notifications) {
            // Get the original user_variable_id using the map created earlier
            const userVariableId = scheduleIdToUserVariableIdMap.get(n.reminder_schedule_id);
            if (!userVariableId) {
                 logger.warn("Timeline mapping: Could not find userVariableId for scheduleId", { scheduleId: n.reminder_schedule_id });
                 continue; // Skip if we can't link back to a user variable
            }
            const details = variableDetailsMap.get(userVariableId);
             if (!details) {
                 logger.warn("Timeline mapping: Could not find variable details for userVariableId", { userVariableId });
                 continue; // Skip if details aren't available
             }
            
            let itemStatus: TimelineItemBase['status'];
            let measurementValue: number | null | undefined = undefined;
            let measurementNotes: string | null | undefined = undefined;

            if (n.status === 'pending') {
                itemStatus = 'pending';
            } else if (n.status === 'completed' || n.status === 'skipped') {
                itemStatus = n.status;
                 // Attempt to find the linked measurement details IF status is completed
                 // This is slightly redundant if we skip completedMeasurementIds above, but safer
                 if (n.status === 'completed' && n.log_details) {
                     const logDetails = n.log_details as any;
                     if (logDetails.measurementId && typeof logDetails.measurementId === 'string') {
                        const linkedMeasurement = measurements.find(m => m.id === logDetails.measurementId);
                        if(linkedMeasurement) {
                            measurementValue = linkedMeasurement.value;
                            measurementNotes = linkedMeasurement.notes;
                        }
                     }
                 }
            } else {
                continue; 
            }

            timelineItems.push({
                id: n.id, 
                type: 'reminder',
                timestamp: n.notification_trigger_at,
                status: itemStatus,
                userVariableId: userVariableId,
                globalVariableId: details.global_id,
                variableName: details.name,
                variableEmoji: details.emoji,
                unitName: details.unit_name,
                reminderScheduleId: n.reminder_schedule_id,
                reminderNotificationId: n.id,
                reminderDefaultValue: (n.reminder_schedules as any)?.default_value ?? null,
                measurementValue: measurementValue, // Add potentially linked measurement value
                measurementNotes: measurementNotes, // Add potentially linked measurement notes
            });
        }

        // Sort combined list by timestamp
        timelineItems.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        logger.info("getDailyTimelineItemsAction: Processing complete", { finalItemCount: timelineItems.length });
        return { success: true, data: timelineItems };

    } catch (error: any) {
        logger.error("getDailyTimelineItemsAction: Unhandled error", { userId, userVariableIds, targetDate, error });
        return { success: false, error: "An unexpected error occurred while fetching timeline data." };
    }
} 