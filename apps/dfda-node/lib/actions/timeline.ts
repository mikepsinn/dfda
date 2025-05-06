"use server"

import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";
import { unstable_noStore as noStore } from 'next/cache';
import { startOfDay, endOfDay, parseISO, isValid } from 'date-fns';
import type { TimelineItem, MeasurementStatus } from '@/components/universal-timeline';

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

// Define the type structure expected from the Supabase query with joins
type FetchedNotification = Database['public']['Tables']['reminder_notifications']['Row'] & {
    reminder_schedules: (
        Pick<Database['public']['Tables']['reminder_schedules']['Row'], 'id' | 'user_variable_id' | 'time_of_day' | 'default_value' | 'notification_title_template' | 'notification_message_template'>
        & {
            user_variables: (
                Pick<Database['public']['Tables']['user_variables']['Row'], 'id' | 'global_variable_id' | 'preferred_unit_id'>
                & {
                    global_variables: (
                        Pick<Database['public']['Tables']['global_variables']['Row'], 'id' | 'name' | 'variable_category_id' | 'default_unit_id' | 'description' | 'emoji'>
                        & {
                            // Join default unit directly on global_variables
                            default_unit: Pick<Database['public']['Tables']['units']['Row'], 'id' | 'abbreviated_name' | 'name'> | null;
                            variable_categories: Pick<Database['public']['Tables']['variable_categories']['Row'], 'id' | 'name'> | null;
                        }
                    ) | null;
                    // Join preferred unit directly on user_variables
                    preferred_unit: Pick<Database['public']['Tables']['units']['Row'], 'id' | 'abbreviated_name' | 'name'> | null;
                }
            ) | null;
        }
    ) | null;
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

/**
 * Fetches reminder notifications for a specific user and date to populate the timeline.
 */
export async function getTimelineNotificationsForDateAction(
  userId: string,
  targetDate: Date
): Promise<{ success: boolean; data?: TimelineItem[]; error?: string }> {
  const supabase = await createClient();
  const dateStr = targetDate.toISOString().split('T')[0];
  logger.info('Fetching timeline notifications for date', { userId, date: dateStr });

  const dayStart = startOfDay(targetDate).toISOString();
  const dayEnd = endOfDay(targetDate).toISOString();

  // Fetch notifications for the target date range and join related data
  const { data: notifications, error } = await supabase
    .from('reminder_notifications')
    .select(`
      id,
      notification_trigger_at,
      status,
      log_details,
      reminder_schedule_id, 
      reminder_schedules!inner(
        id,
        user_variable_id,
        time_of_day,
        default_value,
        notification_title_template,
        notification_message_template,
        user_variables!inner(
            id,
            global_variable_id,
            preferred_unit_id,
            global_variables!inner(
                id,
                name,
                variable_category_id,
                description,
                emoji,
                default_unit_id,
                default_unit:units!global_variables_default_unit_id_fkey( id, name, abbreviated_name ),
                variable_categories( id, name )
            ),
            preferred_unit:units!user_variables_preferred_unit_id_fkey( id, name, abbreviated_name )
        )
      )
    `)
    .eq('user_id', userId)
    .gte('notification_trigger_at', dayStart)
    .lt('notification_trigger_at', dayEnd) // Use less than end of day
    .order('notification_trigger_at', { ascending: true }); // Show oldest first

  if (error) {
    logger.error('Error fetching timeline notifications', { userId, date: dateStr, error });
    console.error("Supabase fetch error (timeline notifications):", JSON.stringify(error, null, 2));
    return { success: false, error: "Database error fetching timeline data." };
  }

  // --- Add Logging Here --- 
  logger.debug("Raw notifications fetched from DB", { count: notifications?.length ?? 0, notifications: notifications?.map(n => ({id: n.id, triggerAt: n.notification_trigger_at, status: n.status})) });
  // ------------------------

  if (!notifications) {
    logger.info('No timeline notifications found for date', { userId, date: dateStr });
    return { success: true, data: [] };
  }

  // Map to the TimelineItem structure
  const timelineItems: TimelineItem[] = notifications.map((n): TimelineItem | null => {
    const notification = n as FetchedNotification; // Cast to the more specific type
    const schedule = notification.reminder_schedules;
    const userVar = schedule?.user_variables;
    const globalVar = userVar?.global_variables;
    const category = globalVar?.variable_categories; // Note: Now joined directly on global_variables
    const preferredUnit = userVar?.preferred_unit;
    const defaultUnit = globalVar?.default_unit;
    const actualUnit = preferredUnit || defaultUnit;

    // Perform checks ensuring all required nested data is present
    if (!schedule || !userVar || !globalVar || !category || !actualUnit) {
      logger.warn("Missing required nested data for timeline item, skipping notification", {
          notificationId: notification.id,
          scheduleMissing: !schedule,
          userVarMissing: !userVar,
          globalVarMissing: !globalVar,
          categoryMissing: !category,
          unitMissing: !actualUnit
      });
      return null; // Skip items with missing critical data
    }

    // Ensure variableCategoryId is valid before casting
    const variableCategoryId = category.id as TimelineItem['variableCategoryId'];

    return {
      id: notification.id,
      globalVariableId: globalVar.id,
      userVariableId: userVar.id,
      variableCategoryId: variableCategoryId,
      name: globalVar.name,
      triggerAtUtc: notification.notification_trigger_at, // Use the raw UTC string
      value: schedule.default_value, // Use default value from schedule
      unit: actualUnit.abbreviated_name,
      unitName: actualUnit.name,
      status: notification.status as MeasurementStatus, // Assuming direct mapping works
      notes: notification.log_details ? JSON.stringify(notification.log_details) : undefined, // Example notes handling
      details: globalVar.description || undefined,
      isEditable: notification.status === 'pending', // Example edit logic
      reminderScheduleId: notification.reminder_schedule_id,
    };
  }).filter((item): item is TimelineItem => item !== null); // Filter out null items

  logger.info(`Found and mapped ${timelineItems.length} timeline items for date`, { userId, date: dateStr });
  return { success: true, data: timelineItems };
}

// Moved from components/patient/patient-timeline.tsx
export async function getTimelineItemsForDate(userId: string, date: Date): Promise<TimelineItem[]> {
    logger.info(`Fetching timeline items via action for user ${userId} on ${date.toISOString().split('T')[0]}`);

    const result = await getTimelineNotificationsForDateAction(userId, date);

    if (!result.success || !result.data) {
        logger.error("Failed to fetch timeline items using action", { userId, date, error: result.error });
        return []; 
    }

    logger.info(`Action returned ${result.data.length} timeline items`);
    return result.data;
} 