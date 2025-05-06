"use server"

import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";
import { unstable_noStore as noStore } from 'next/cache';
import { startOfDay, endOfDay, parseISO, isValid } from 'date-fns';
import type { TimelineItem } from '@/components/universal-timeline';
import type { MeasurementStatus } from '@/components/shared/measurement-notification-item';

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

  // Step 1: Prepare to fetch linked measurements for completed items
  const completedMeasurementIds = notifications
    .filter(n => n.status === 'completed' && n.log_details && (n.log_details as any).measurementId)
    .map(n => (n.log_details as any).measurementId as string);

  // Step 2: Fetch the linked measurements if any IDs were found
  const linkedMeasurementsMap = new Map<string, number>();
  if (completedMeasurementIds.length > 0) {
    const { data: measurementsData, error: measurementsError } = await supabase
      .from('measurements')
      .select('id, value')
      .in('id', completedMeasurementIds)
      .eq('user_id', userId); // Ensure user ownership

    if (measurementsError) {
      logger.warn('Error fetching linked measurements for completed timeline items', { userId, date: dateStr, error: measurementsError });
      // Continue without linked values if fetch fails
    } else if (measurementsData) {
      measurementsData.forEach(m => {
        linkedMeasurementsMap.set(m.id, m.value);
      });
    }
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

    // Step 3: Determine the value to display
    let displayValue: number | null = null;
    if (notification.status === 'completed' && notification.log_details) {
      const linkedMeasurementId = (notification.log_details as any)?.measurementId;
      if (linkedMeasurementId && linkedMeasurementsMap.has(linkedMeasurementId)) {
        displayValue = linkedMeasurementsMap.get(linkedMeasurementId)!;
      }
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
      value: displayValue, // Use fetched measurement value if completed, otherwise null
      default_value: schedule.default_value, // Use the correct snake_case field
      unit: actualUnit.abbreviated_name,
      unitId: actualUnit.id,
      unitName: actualUnit.name,
      status: notification.status as MeasurementStatus, // Assuming direct mapping works
      notes: notification.log_details ? JSON.stringify(notification.log_details) : undefined, // Example notes handling
      emoji: globalVar.emoji, // Add emoji
      isEditable: notification.status === 'pending', // Example edit logic
      reminderScheduleId: notification.reminder_schedule_id,
    };
  }).filter((item): item is TimelineItem => item !== null); // Filter out null items

  logger.info(`Found and mapped ${timelineItems.length} timeline items for date`, { userId, date: dateStr });
  return { success: true, data: timelineItems };
}

// Moved from components/patient/patient-timeline.tsx
export async function getTimelineItemsForDate(userId: string, date: Date): Promise<TimelineItem[]> {
    logger.info(`Fetching timeline notification items via action for user ${userId} on ${date.toISOString().split('T')[0]}`);

    const result = await getTimelineNotificationsForDateAction(userId, date);

    if (!result.success || !result.data) {
        logger.error("Failed to fetch timeline items using action", { userId, date, error: result.error });
        return []; 
    }

    logger.info(`Action returned ${result.data.length} timeline items`);
    return result.data;
} 