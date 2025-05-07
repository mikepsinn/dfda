"use server"

import { createClient } from "@/utils/supabase/server";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/database.types";
import { startOfDay, endOfDay } from 'date-fns'; 
import type { ReminderNotificationCardData, ReminderNotificationStatus } from "@/components/reminder-notification-card"; 

// Define the type structure expected from the Supabase query with joins

// Intermediate type for the innermost part of global_variables
type FetchedGlobalVariableCore = Pick<Database['public']['Tables']['global_variables']['Row'], 'id' | 'name' | 'variable_category_id' | 'default_unit_id' | 'description' | 'emoji'>;
type FetchedGlobalVariableUnits = {
    default_unit: Pick<Database['public']['Tables']['units']['Row'], 'id' | 'abbreviated_name' | 'name'> | null;
    variable_categories: Pick<Database['public']['Tables']['variable_categories']['Row'], 'id' | 'name'> | null;
};

// Intermediate type for user_variables
type FetchedUserVariableCore = Pick<Database['public']['Tables']['user_variables']['Row'], 'id' | 'global_variable_id' | 'preferred_unit_id'>;
type FetchedUserVariableNested = {
    global_variables: (FetchedGlobalVariableCore & FetchedGlobalVariableUnits) | null;
    preferred_unit: Pick<Database['public']['Tables']['units']['Row'], 'id' | 'abbreviated_name' | 'name'> | null;
};

// Intermediate type for reminder_schedules
type FetchedReminderScheduleCore = Pick<Database['public']['Tables']['reminder_schedules']['Row'], 'id' | 'user_variable_id' | 'time_of_day' | 'default_value' | 'notification_title_template' | 'notification_message_template'>;
type FetchedReminderScheduleNested = {
    user_variables: (FetchedUserVariableCore & FetchedUserVariableNested) | null;
};

// Final FetchedNotification type
export type FetchedNotification = Database['public']['Tables']['reminder_notifications']['Row'] & {
    reminder_schedules: (FetchedReminderScheduleCore & FetchedReminderScheduleNested) | null;
};

/**
 * Fetches reminder notifications for a specific user and date to populate the timeline.
 * Returns data shaped as ReminderNotificationCardData.
 */
export async function getTimelineNotificationsForDateAction(
    userId: string,
  targetDate: Date
): Promise<{ success: boolean; data?: ReminderNotificationCardData[]; error?: string }> {
        const supabase = await createClient();
  const dateStr = targetDate.toISOString().split('T')[0];
  logger.info('Fetching timeline notifications for date', { userId, date: dateStr });

  const dayStart = startOfDay(targetDate).toISOString();
  const dayEnd = endOfDay(targetDate).toISOString();

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
    .lt('notification_trigger_at', dayEnd) 
    .order('notification_trigger_at', { ascending: true }); 

  if (error) {
    logger.error('Error fetching timeline notifications', { userId, date: dateStr, error });
    console.error("Supabase fetch error (timeline notifications):", JSON.stringify(error, null, 2));
    return { success: false, error: "Database error fetching timeline data." };
  }

  logger.debug("Raw notifications fetched from DB", { count: notifications?.length ?? 0, notifications: notifications?.map(n => ({id: n.id, triggerAt: n.notification_trigger_at, status: n.status})) });

  if (!notifications) {
    logger.info('No timeline notifications found for date', { userId, date: dateStr });
    return { success: true, data: [] };
  }

  const completedMeasurementIds = notifications
    .filter(n => n.status === 'completed' && n.log_details && (n.log_details as any).measurementId)
    .map(n => (n.log_details as any).measurementId as string);

  const linkedMeasurementsMap = new Map<string, number>();
  if (completedMeasurementIds.length > 0) {
    const { data: measurementsData, error: measurementsError } = await supabase
      .from('measurements')
      .select('id, value')
      .in('id', completedMeasurementIds)
      .eq('user_id', userId); 

    if (measurementsError) {
      logger.warn('Error fetching linked measurements for completed timeline items', { userId, date: dateStr, error: measurementsError });
    } else if (measurementsData) {
      measurementsData.forEach(m => {
        linkedMeasurementsMap.set(m.id, m.value);
      });
    }
  }

  const reminderCardDataItems: ReminderNotificationCardData[] = notifications.map((n): ReminderNotificationCardData | null => {
    const notification = n as FetchedNotification; 
    const schedule = notification.reminder_schedules;
    const userVar = schedule?.user_variables;
    const globalVar = userVar?.global_variables;
    const category = globalVar?.variable_categories;
    const preferredUnit = userVar?.preferred_unit;
    const defaultUnit = globalVar?.default_unit;
    const actualUnit = preferredUnit || defaultUnit;

    if (!schedule || !userVar || !globalVar || !category || !actualUnit) {
      logger.warn("Missing required nested data for reminder card data, skipping notification", {
          notificationId: notification.id,
          scheduleMissing: !schedule,
          userVarMissing: !userVar,
          globalVarMissing: !globalVar,
          categoryMissing: !category,
          unitMissing: !actualUnit
      });
      return null; 
    }

    let displayValue: number | null = null;
    if (notification.status === 'completed' && notification.log_details) {
      const linkedMeasurementId = (notification.log_details as any)?.measurementId;
      if (linkedMeasurementId && linkedMeasurementsMap.has(linkedMeasurementId)) {
        displayValue = linkedMeasurementsMap.get(linkedMeasurementId)!;
      }
    }

    const variableCategoryId = category.id as ReminderNotificationCardData['variableCategoryId'];
    const notificationStatus = notification.status as ReminderNotificationStatus;

    return {
      id: notification.id,
      reminderScheduleId: notification.reminder_schedule_id,
      triggerAtUtc: notification.notification_trigger_at,
      status: notificationStatus,
      variableName: globalVar.name, 
      variableCategoryId: variableCategoryId,
      unitId: actualUnit.id,
      unitName: actualUnit.name,
      globalVariableId: globalVar.id,
      userVariableId: userVar.id,
      details: schedule.notification_message_template?.replace("{variableName}", globalVar.name) || globalVar.description || undefined,
      detailsUrl: undefined, 
      isEditable: notification.status === 'pending', 
      defaultValue: schedule.default_value, 
      emoji: globalVar.emoji,
      currentValue: displayValue, 
      loggedValueUnit: displayValue !== null ? actualUnit.name : undefined,
    };
  }).filter((item): item is ReminderNotificationCardData => item !== null);

  logger.info(`Found and mapped ${reminderCardDataItems.length} reminder card data items for date`, { userId, date: dateStr });
  return { success: true, data: reminderCardDataItems };
} 