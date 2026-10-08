"use server"

import { Prisma } from "@/lib/db";
import { getUserDb } from "@/lib/db/server";
import { logger } from "@/lib/logger";
import { startOfDay, endOfDay } from 'date-fns'; 
import type { ReminderNotificationDetails, ReminderNotificationStatus, VariableCategoryId } from "@/lib/database.types.custom";
import { revalidatePath } from 'next/cache';

const unitSelect = { select: { id: true, name: true, abbreviated_name: true } } as const;

/** Returns the measurement ID stored in a notification's log_details, if any. */
function getLinkedMeasurementId(logDetails: Prisma.JsonValue): string | null {
  if (logDetails && typeof logDetails === 'object' && !Array.isArray(logDetails)) {
    const measurementId = logDetails.measurementId;
    return typeof measurementId === 'string' && measurementId ? measurementId : null;
  }
  return null;
}

/**
 * Fetches reminder notifications for a specific user and date to populate the timeline.
 * Returns data shaped as ReminderNotificationDetails.
 */
export async function getTimelineNotificationsForDateAction(
    userId: string,
  targetDate: Date
): Promise<{ success: boolean; data?: ReminderNotificationDetails[]; error?: string }> {
  const db = await getUserDb();
  const dateStr = targetDate.toISOString().split('T')[0];
  logger.info('Fetching timeline notifications for date', { userId, date: dateStr });

  const dayStart = startOfDay(targetDate);
  const dayEnd = endOfDay(targetDate);

  let notifications;
  try {
    notifications = await db.reminder_notifications.findMany({
      where: {
        user_id: userId,
        notification_trigger_at: { gte: dayStart, lt: dayEnd },
      },
      orderBy: { notification_trigger_at: 'asc' },
      select: {
        id: true,
        notification_trigger_at: true,
        status: true,
        log_details: true,
        reminder_schedule_id: true,
        reminder_schedules: {
          select: {
            id: true,
            user_variable_id: true,
            default_value: true,
            notification_title_template: true,
            notification_message_template: true,
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
                    units: unitSelect,
                    variable_categories: { select: { id: true, name: true } },
                  },
                },
                units: unitSelect,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching timeline notifications', { userId, date: dateStr, error });
    return { success: false, error: "Database error fetching timeline data." };
  }

  logger.debug("Raw notifications fetched from DB", { count: notifications.length, notifications: notifications.map(n => ({id: n.id, triggerAt: n.notification_trigger_at, status: n.status})) });

  const completedMeasurementIds = notifications
    .filter(n => n.status === 'completed')
    .map(n => getLinkedMeasurementId(n.log_details))
    .filter((id): id is string => id !== null);

  const linkedMeasurementsMap = new Map<string, number>();
  if (completedMeasurementIds.length > 0) {
    try {
      const measurementsData = await db.measurements.findMany({
        where: { id: { in: completedMeasurementIds }, user_id: userId },
        select: { id: true, value: true },
      });
      measurementsData.forEach(m => {
        linkedMeasurementsMap.set(m.id, m.value);
      });
    } catch (measurementsError) {
      logger.warn('Error fetching linked measurements for completed timeline items', { userId, date: dateStr, error: measurementsError });
    }
  }

  const reminderDetailsItems: ReminderNotificationDetails[] = notifications.map((notification): ReminderNotificationDetails => {
    const schedule = notification.reminder_schedules;
    const userVar = schedule.user_variables;
    const globalVar = userVar.global_variables;
    const category = globalVar.variable_categories;
    // Preferred unit of the user variable, otherwise the global variable's default unit
    const actualUnit = userVar.units || globalVar.units;

    let displayValue: number | null = null;
    if (notification.status === 'completed') {
      const linkedMeasurementId = getLinkedMeasurementId(notification.log_details);
      if (linkedMeasurementId && linkedMeasurementsMap.has(linkedMeasurementId)) {
        displayValue = linkedMeasurementsMap.get(linkedMeasurementId)!;
      }
    }

    const variableCatId = category.id as VariableCategoryId;
    const notifStatus = notification.status as ReminderNotificationStatus;

    return {
      notificationId: notification.id,
      scheduleId: notification.reminder_schedule_id,
      userVariableId: userVar.id,
      variableName: globalVar.name, 
      globalVariableId: globalVar.id,
      variableCategory: variableCatId,
      unitId: actualUnit.id,
      unitName: actualUnit.name,
      dueAt: notification.notification_trigger_at.toISOString(),
      title: schedule.notification_title_template || globalVar.name,
      message: schedule.notification_message_template?.replace("{variableName}", globalVar.name) || globalVar.description || null,
      status: notifStatus,
      defaultValue: schedule.default_value, 
      emoji: globalVar.emoji,
      value: displayValue,
      isEditable: true,
    };
  });

  logger.info(`Found and mapped ${reminderDetailsItems.length} reminder details items for date`, { userId, date: dateStr });
  return { success: true, data: reminderDetailsItems };
} 

// --- START of getPendingReminderNotificationsAction --- 
/**
 * Fetches PENDING reminder notifications for a user.
 */
export async function getPendingReminderNotificationsAction(
  userId: string
): Promise<ReminderNotificationDetails[]> { 
  logger.info('Fetching pending reminder notifications', { userId });

  let notifications;
  try {
    const db = await getUserDb();
    notifications = await db.reminder_notifications.findMany({
      where: { user_id: userId, status: 'pending' },
      orderBy: { notification_trigger_at: 'asc' },
      select: {
        id: true,
        notification_trigger_at: true,
        status: true,
        reminder_schedules: {
          select: {
            id: true,
            user_variable_id: true,
            default_value: true,
            notification_title_template: true,
            notification_message_template: true,
            user_variables: {
              select: {
                global_variable_id: true,
                preferred_unit_id: true,
                global_variables: {
                  select: {
                    name: true,
                    variable_category_id: true,
                    default_unit_id: true,
                    emoji: true,
                    units: unitSelect,
                    variable_categories: { select: { id: true, name: true } },
                  },
                },
                units: unitSelect,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    logger.error('Error fetching pending reminder notifications', { userId, error });
    return []; 
  }

  const mappedNotifications: (ReminderNotificationDetails | null)[] = notifications
    .map(n => {
      const schedule = n.reminder_schedules;
      const userVar = schedule.user_variables;
      const globalVar = userVar.global_variables;
      const category = globalVar.variable_categories;
      const preferredUnit = userVar.units;
      const defaultUnit = globalVar.units;

      const resolvedUnitId = preferredUnit?.id || defaultUnit.id;
      const resolvedUnitName = preferredUnit?.abbreviated_name || defaultUnit.abbreviated_name;

      if (!resolvedUnitId || !resolvedUnitName) {
        logger.warn('Skipping pending notification due to missing unit information (id or name)', { 
          notificationId: n.id, 
          resolvedUnitId, 
          resolvedUnitName 
        });
        return null; 
      }
      
      if (!category.id) {
          logger.warn('Skipping pending notification due to missing variable category ID', { notificationId: n.id, category });
          return null; 
      }

      return {
          notificationId: n.id,
          scheduleId: schedule.id,
          userVariableId: schedule.user_variable_id,
          variableName: globalVar.name || 'Unknown Item',
          globalVariableId: userVar.global_variable_id,
          // Ensure this cast is to the correct VariableCategoryId type if ReminderNotificationDetails expects it
          variableCategory: category.id as ReminderNotificationDetails['variableCategory'], 
          unitId: resolvedUnitId,
          unitName: resolvedUnitName,
          dueAt: n.notification_trigger_at.toISOString(),
          title: schedule.notification_title_template || null,
          message: schedule.notification_message_template || null,
          status: n.status, 
          defaultValue: schedule.default_value,       
          emoji: globalVar.emoji,                   
      };
    });

  const tasks: ReminderNotificationDetails[] = mappedNotifications
    .filter((task): task is ReminderNotificationDetails => {
      if (task === null) return false;
      return typeof task.notificationId === 'string' && 
             typeof task.unitId === 'string' && 
             typeof task.unitName === 'string' &&
             typeof task.variableCategory === 'string';
    });

  logger.info(`Found ${tasks.length} pending reminder notifications`, { userId });
  return tasks;
}
// --- END of getPendingReminderNotificationsAction --- 

// --- START of completeReminderNotificationAction ---
/**
 * Updates the status of a specific reminder notification.
 */
export async function completeReminderNotificationAction(
   notificationId: string, 
   userId: string, 
   skipped: boolean = false,
   logDetails?: any 
): Promise<{ success: boolean; error?: string; }> { 
   const newStatus = skipped ? 'skipped' : 'completed';
   logger.info('Completing reminder notification', { notificationId, userId, newStatus, logDetails });

   try {
        const db = await getUserDb();
        await db.reminder_notifications.updateMany({
            where: {
                id: notificationId,
                user_id: userId,
                status: 'pending',
            },
            data: {
                status: newStatus,
                completed_or_skipped_at: new Date(),
                log_details: logDetails || Prisma.DbNull,
            },
        });
   } catch (error) {
        logger.error("Error updating reminder notification status", { notificationId, userId, error });
        return { success: false, error: "Could not update the notification status." };
   }

   revalidatePath(`/components/patient/TrackingInbox`); // This path might not be ideal for revalidation
   revalidatePath(`/patient/dashboard`);

   logger.info("Reminder notification completed successfully", { notificationId, newStatus });
   return { success: true }; 
} 
// --- END of completeReminderNotificationAction --- 

// Interface for a generic action result
interface ActionResult {
  success: boolean;
  error?: string;
  data?: any;
}

/**
 * Creates a measurement and then completes the associated reminder notification.
 */
export async function createMeasurementAndCompleteNotificationAction(params: {
  userId: string;
  globalVariableId: string;
  value: number;
  unitId: string;
  notificationId: string;
  scheduleId: string; // Though not directly used in this action currently, kept for consistency with prior thinking
  notes?: string;
}): Promise<ActionResult> {
  logger.info('createMeasurementAndCompleteNotificationAction called', params);

  // Step 1: Create the measurement
  let newMeasurement: { id: string };
  try {
    const db = await getUserDb();
    newMeasurement = await db.measurements.create({
      data: {
        user_id: params.userId,
        global_variable_id: params.globalVariableId,
        value: params.value,
        unit_id: params.unitId,
        notes: params.notes,
        start_at: new Date(), // Or use notification.dueAt if preferred
      },
      select: { id: true },
    });
  } catch (measurementError) {
    logger.error('Error creating measurement from notification', { ...params, error: measurementError });
    return { success: false, error: "Failed to create measurement." };
  }

  logger.info('Measurement created from notification', { measurementId: newMeasurement.id, notificationId: params.notificationId });

  // Step 2: Complete the notification, linking the measurement
  const completeResult = await completeReminderNotificationAction(
    params.notificationId,
    params.userId,
    false, // skipped = false
    { measurementId: newMeasurement.id, loggedValue: params.value } // logDetails
  );

  if (!completeResult.success) {
    // Note: Measurement was created. Consider compensation logic if critical (e.g., delete measurement).
    // For now, we'll just report the error from completing the notification.
    logger.error('Measurement created, but failed to complete notification', { ...params, measurementId: newMeasurement.id, error: completeResult.error });
    return { success: false, error: completeResult.error || "Measurement logged, but failed to update notification status." };
  }

  // Revalidate paths after successful operation
  revalidatePath('/patient/dashboard'); // Revalidate the main dashboard
  // Add other relevant paths, e.g., a page listing all measurements
  // revalidatePath('/patient/measurements'); 

  return { success: true, data: { measurementId: newMeasurement.id } };
}

/**
 * Reverts a completed or skipped notification back to pending.
 */
export async function undoNotificationAction(params: {
  notificationId: string;
  userId: string;
}): Promise<ActionResult> {
  logger.info('undoNotificationAction called', params);

  // Optionally, fetch the notification first if you need to inspect log_details
  // to delete/disassociate a linked measurement. For simplicity, we'll just update status and clear details here.
  try {
    const db = await getUserDb();
    await db.reminder_notifications.updateMany({
      where: {
        id: params.notificationId,
        user_id: params.userId,
        // Potentially add a condition: status: { in: ['completed', 'skipped'] } to only undo if not already pending
      },
      data: {
        status: 'pending',
        completed_or_skipped_at: null,
        log_details: Prisma.DbNull,
      },
    });
  } catch (updateError) {
    logger.error('Error undoing notification status', { ...params, error: updateError });
    return { success: false, error: "Failed to undo notification status." };
  }

  // Revalidate paths
  revalidatePath('/patient/dashboard');
  // revalidatePath('/patient/measurements'); 

  return { success: true };
}
