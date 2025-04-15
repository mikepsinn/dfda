"use server"

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import { RRule, rrulestr } from 'rrule'
import { DateTime } from 'luxon'
import { toZonedTime } from 'date-fns-tz'
// import { handleDatabaseCollectionResponse } from '@/lib/actions-helpers' // Unused import
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
// REMOVE the Trigger.dev client import
// import { client } from '@/lib/trigger' 

// Types
export type ReminderSchedule = Database['public']['Tables']['reminder_schedules']['Row']
// Type for data coming from the client component
export type ReminderScheduleClientData = {
  rruleString: string;
  timeOfDay: string; // HH:mm
  timezone: string;
  startDate: Date; // Client sends Date object
  endDate?: Date | null;
  isActive: boolean;
}
// Type for inserting/updating in the database
export type ReminderScheduleDbData = Omit<Database['public']['Tables']['reminder_schedules']['Insert'], 'id' | 'created_at' | 'updated_at' | 'next_trigger_at'> & {
    // We might allow updating next_trigger_at separately later
    next_trigger_at?: string | null;
}

// --- Server Actions ---

// Get all reminder schedules for a global variable concept
export async function getReminderSchedulesForUserVariableAction(globalVariableId: string): Promise<ReminderSchedule[]> {
    const supabase = await createClient();
    logger.info('Fetching reminder schedules', { globalVariableId });

    if (!globalVariableId) {
        logger.warn('getReminderSchedulesForUserVariableAction called with no globalVariableId');
        return [];
    }

    const { data, error } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('user_variable_id', globalVariableId)
        .order('created_at', { ascending: true });

    if (error) {
        logger.error('Error fetching reminder schedules', { globalVariableId, error });
        throw new Error('Could not fetch reminder schedules.');
    }
    return data || [];
}

// Upsert a reminder schedule for a global variable concept
export async function upsertReminderScheduleAction(
    globalVariableId: string,
    scheduleData: ReminderScheduleClientData,
    userId: string,
    scheduleIdToUpdate?: string | null
): Promise<{ success: boolean; data?: ReminderSchedule; error?: string; message?: string }> {
    const supabase = await createClient();
    logger.info('Upserting reminder schedule', { globalVariableId, scheduleIdToUpdate, isActive: scheduleData.isActive });

    // Validation
    if (!globalVariableId) {
        return { success: false, error: 'Global Variable ID is required.' };
    }
    if (!scheduleData.timeOfDay?.match(/^([01]\d|2[0-3]):([0-5]\d)$/)) { // Basic HH:mm validation
        return { success: false, error: 'Invalid time format (HH:mm required).' };
    }
    if (!scheduleData.timezone) {
        // Basic check - could validate against a known list if needed
        return { success: false, error: 'Timezone is required.' };
    }
    // let rule: RRule; // rule assignment is never used
    try {
        // Validate RRULE string basic structure and parse it
        /* rule = */ rrulestr(scheduleData.rruleString) as RRule; // Removed unused assignment
    } catch (e) {
        logger.error('Invalid RRULE string provided', { rruleString: scheduleData.rruleString, error: e });
        return { success: false, error: 'Invalid recurrence rule format.' };
    }

    try {
        let nextTriggerAtIso: string | null = null;

        // --- Determine next_trigger_at ---
        if (scheduleIdToUpdate) { // === UPDATE ===
             // For updates, calculate the actual next trigger time if active
             if (scheduleData.isActive) {
                 try {
                    // Existing logic to calculate the real next trigger based on RRULE, time, timezone
                    const updateRule = rrulestr(scheduleData.rruleString) as RRule;
                    const nowUtc = new Date();
                    const [hours, minutes] = scheduleData.timeOfDay.split(':').map(Number);
                    
                    // Ensure dtstart is a Date object before using toZonedTime
                    let dtstartDate: Date;
                    if (updateRule.options.dtstart instanceof Date) {
                      dtstartDate = updateRule.options.dtstart;
                    } else {
                      // Attempt to parse if it's a string or number? Requires more robust handling or assumptions.
                      // For now, let's assume it's already a Date based on rrule parsing, 
                      // or default if not available (though rrule typically sets a default).
                      logger.warn('Could not determine Date object for dtstart, defaulting.', { dtstart: updateRule.options.dtstart });
                      dtstartDate = new Date(); // Fallback, might need adjustment
                    }
                    dtstartDate.setHours(hours, minutes, 0, 0); // Apply time of day

                    const options = {
                        ...updateRule.options,
                        // Ensure dtstart is a Date object before passing to toZonedTime
                        dtstart: toZonedTime(dtstartDate, scheduleData.timezone),
                        tzid: scheduleData.timezone, // Ensure timezone is passed if needed by rrule logic
                    };
                    const calculationRule = new RRule(options);
                    const nowInTargetTz = toZonedTime(nowUtc, scheduleData.timezone); // Use toZonedTime for comparison time
                    const nextOccurrence = calculationRule.after(nowInTargetTz, true); // Find next after current time in target TZ

                    if (nextOccurrence) {
                         // Convert the result back to ISO string in UTC for storage
                        nextTriggerAtIso = DateTime.fromJSDate(nextOccurrence).setZone(scheduleData.timezone).toISO();
                        logger.info('Calculated next trigger time for UPDATE', { nextTriggerAtIso, timezone: scheduleData.timezone });
                    } else {
                        logger.info('No future occurrences found for updated rule', { globalVariableId, scheduleIdToUpdate });
                        nextTriggerAtIso = null; // Explicitly null if no future dates
                    }
                 } catch (ruleError) {
                      logger.error('Error calculating next trigger time during update', { scheduleIdToUpdate, rruleString: scheduleData.rruleString, error: ruleError });
                      nextTriggerAtIso = null;
                 }
            } else {
                // If updating to inactive, clear the next trigger time
                logger.info('Updated schedule is inactive, setting next_trigger_at to null', { globalVariableId, scheduleIdToUpdate });
                nextTriggerAtIso = null;
            }

        } else { // === INSERT ===
            // For NEW reminders, set trigger time to the past to show in inbox immediately.
            // The cron job/scheduler will handle calculating the *real* next trigger upon completion.
            nextTriggerAtIso = new Date(Date.now() - 60 * 1000).toISOString(); // 1 minute ago
            logger.info('Setting initial trigger time to the past for NEW reminder', { nextTriggerAtIso });
        }
        // --- End Determine next_trigger_at ---

        const dbData: ReminderScheduleDbData & { user_id: string } = {
            user_id: userId,
            user_variable_id: globalVariableId,
            is_active: scheduleData.isActive,
            rrule: scheduleData.rruleString,
            time_of_day: scheduleData.timeOfDay,
            timezone: scheduleData.timezone,
            start_date: scheduleData.startDate.toISOString(), // Store start date as sent by client
            end_date: scheduleData.endDate ? scheduleData.endDate.toISOString() : null,
            next_trigger_at: nextTriggerAtIso, // Assign calculated value here
            // notification_title_template: ..., // Add if needed
            // notification_message_template: ..., // Add if needed
        };

        let response;
        if (scheduleIdToUpdate) {
            // Update existing schedule
            logger.info('Updating existing schedule', { scheduleIdToUpdate });
            response = await supabase
                .from('reminder_schedules')
                .update(dbData) // Pass all updatable fields
                .eq('id', scheduleIdToUpdate)
                .eq('user_id', userId) // Ensure user owns the schedule
                .select()
                .single();
        } else {
            // Insert new schedule (or update if unique constraint hit - needs constraint)
            // Assuming a unique constraint on user_variable_id might exist if only one reminder per variable is allowed.
            // If multiple reminders are allowed per variable, use simple insert.
             logger.info('Inserting new schedule');
             // For now, simple insert. Add UNIQUE constraint later if needed.
             response = await supabase
                .from('reminder_schedules')
                .insert(dbData)
                .select()
                .single();
        }

        if (response.error) {
            logger.error('Error upserting reminder schedule', { error: response.error, globalVariableId });
            throw response.error;
        }

        logger.info('Successfully upserted reminder schedule', { scheduleId: response.data.id });

        // Revalidate paths (could be more specific if needed)
        revalidatePath('/patient/reminders'); // Assuming a general reminders page
        // revalidatePath(`/patient/variables/${globalVariableId}`);

        return { success: true, data: response.data, message: 'Reminder schedule saved.' };

    } catch (error) {
        logger.error("Failed in upsertReminderScheduleAction", { globalVariableId, error: error instanceof Error ? error.message : String(error) });
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

// Delete a specific reminder schedule
export async function deleteReminderScheduleAction(
    scheduleId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    const supabase = await createClient();
    logger.warn('Deleting reminder schedule and related notifications', { scheduleId, userId });

    if (!scheduleId) {
        return { success: false, error: 'Schedule ID is required.' };
    }

    try {
        // Deleting the schedule should cascade delete notifications due to FK constraint
        const { error } = await supabase
            .from('reminder_schedules')
            .delete()
            .eq('id', scheduleId)
            .eq('user_id', userId); // Ensure user owns the schedule

        if (error) {
            logger.error('Error deleting reminder schedule', { error, scheduleId });
            throw error;
        }

        logger.info('Successfully deleted reminder schedule', { scheduleId });
        revalidatePath('/patient/reminders'); // Revalidate general page
        revalidatePath('/patient/dashboard'); // Revalidate dashboard too
        return { success: true };

    } catch (error) {
        logger.error('Failed in deleteReminderScheduleAction', { scheduleId, error: error instanceof Error ? error.message : String(error) });
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

// --- Default Reminder Setup Action ---

/**
 * Creates a simple, default daily reminder for a given user variable (condition/treatment).
 * Assumes a standard time (e.g., 7 PM) and generates a basic RRULE.
 */
export async function createDefaultReminderAction(
  userId: string,
  userVariableId: string, // Changed from globalVariableId for clarity
  variableName: string,
  variableCategory: string | null // Pass category to determine message
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  logger.info('Creating default reminder', { userId, userVariableId, variableName });

  if (!userId || !userVariableId || !variableName) {
    return { success: false, error: 'Missing required information for default reminder.' };
  }

  try {
    // --- Get User Timezone --- 
    let userTimezone: string = 'UTC'; // Default fallback timezone
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('timezone')
      .eq('id', userId)
      .single();

    if (profileError) {
      logger.warn('Could not fetch user profile for timezone', { userId, error: profileError });
      // Proceed with fallback timezone
    } else if (profile?.timezone) {
      userTimezone = profile.timezone;
      logger.info('Using user timezone for default reminder', { userId, timezone: userTimezone });
    } else {
      logger.warn('User profile does not have a timezone set, using fallback', { userId, fallback: userTimezone });
    }
    // --- End Get User Timezone --- 

    // --- Define Default Settings --- 
    const defaultTime = "20:00"; // 8 PM
    const defaultRRule = `FREQ=DAILY;DTSTART=${new Date().toISOString().split('T')[0].replace(/-/g, '')}T000000Z`; // Daily starting today (UTC date part)
    const defaultTitle = variableCategory === 'medication' 
                         ? `Track ${variableName} Adherence` 
                         : `Track ${variableName}`; // Generic title otherwise
    const defaultMessage = variableCategory === 'medication'
                         ? `Did you take your ${variableName} today?`
                         : `How was your ${variableName} today?`; // Generic message
    // --- End Default Settings --- 
  
    // Simplified data for insertion - calculation of next_trigger_at handled by upsert action logic
    // We need to call upsert instead of direct insert to leverage that logic
    const scheduleData: ReminderScheduleClientData = {
        rruleString: defaultRRule,
        timeOfDay: defaultTime,
        timezone: userTimezone, // Use fetched or fallback timezone
        startDate: new Date(), // Start today
        isActive: true,
    };

    // Call the existing upsert action to handle RRULE parsing and next_trigger_at calculation
    // We are *inserting*, so no scheduleIdToUpdate is provided.
    const result = await upsertReminderScheduleAction(
        userVariableId,
        scheduleData,
        userId
        // scheduleIdToUpdate is omitted for insertion
    );

    if (!result.success || !result.data) {
      logger.error('Failed to create default reminder schedule via upsert', { userId, userVariableId, error: result.error });
      return { success: false, error: result.error || 'Failed to create default reminder schedule.' };
    }

    // Update title/message templates
    const { error: updateError } = await supabase
        .from('reminder_schedules')
        .update({
            notification_title_template: defaultTitle,
            notification_message_template: defaultMessage,
        })
        .eq('id', result.data.id)
        .eq('user_id', userId);
    
    if (updateError) {
         logger.warn('Failed to update title/message for default reminder', { scheduleId: result.data.id, updateError });
         // Don't fail the whole operation for this
    }

    logger.info('Successfully created default reminder schedule', { scheduleId: result.data.id, userId, userVariableId });

    // Optionally revalidate paths if needed immediately
    // revalidatePath('/patient/reminders');

    return { success: true };

  } catch (error) {
    logger.error('Failed in createDefaultReminderAction', { userId, userVariableId, error: error instanceof Error ? error.message : String(error) });
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { success: false, error: errorMessage };
  }
} 

// --- Refactored Tracking Inbox Actions --- 

// New type for the data needed by the TrackingInbox component
export type PendingNotificationTask = {
  notificationId: string; // The ID of the reminder_notifications record
  scheduleId: string;
  userVariableId: string;
  variableName: string;
  globalVariableId: string;
  variableCategory: string | null;
  unitId: string | null;
  unitName: string | null;
  dueAt: string; // The original notification_trigger_at timestamp
  title: string | null; // From schedule template
  message: string | null; // From schedule template
};

/**
 * Fetches PENDING reminder notifications for a user.
 */
export async function getPendingReminderNotificationsAction(
  userId: string
): Promise<PendingNotificationTask[]> {
  const supabase = await createClient();
  logger.info('Fetching pending reminder notifications', { userId });

  // Fetch pending notifications and join related data
  const { data: notifications, error } = await supabase
    .from('reminder_notifications')
    .select(`
      id, 
      notification_trigger_at,
      reminder_schedules!inner(
        id,
        user_variable_id,
        notification_title_template,
        notification_message_template,
        user_variables!inner(
            global_variable_id,
            preferred_unit_id,
            global_variables!inner(
                name,
                variable_category_id,
                default_unit_id,
                default_unit:units!global_variables_default_unit_id_fkey( id, abbreviated_name ) 
            ),
            preferred_unit:units!user_variables_preferred_unit_id_fkey( id, abbreviated_name )
        )
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'pending') // Only fetch pending
    .order('notification_trigger_at', { ascending: true }); // Show oldest first

  if (error) {
    logger.error('Error fetching pending reminder notifications', { userId, error });
    console.error("Supabase fetch error (pending notifications):", JSON.stringify(error, null, 2));
    return []; 
  }

  if (!notifications) {
    return [];
  }

  // Map to the defined task structure
  const tasks: PendingNotificationTask[] = notifications.map(n => {
    const schedule = n.reminder_schedules as any;
    const userVar = schedule?.user_variables as any;
    const globalVar = userVar?.global_variables as any;
    const preferredUnit = userVar?.preferred_unit as any;
    const defaultUnit = globalVar?.default_unit as any;

    const resolvedUnitId = preferredUnit?.id || defaultUnit?.id || null;
    const resolvedUnitName = preferredUnit?.abbreviated_name || defaultUnit?.abbreviated_name || null;

    return {
        notificationId: n.id,
        scheduleId: schedule?.id || '',
        userVariableId: schedule?.user_variable_id || '',
        variableName: globalVar?.name || 'Unknown Item',
        globalVariableId: userVar?.global_variable_id || '',
        variableCategory: globalVar?.variable_category_id || null,
        unitId: resolvedUnitId,
        unitName: resolvedUnitName,
        dueAt: n.notification_trigger_at as string,
        title: schedule?.notification_title_template || null,
        message: schedule?.notification_message_template || null,
    };
  });

  logger.info(`Found ${tasks.length} pending reminder notifications`, { userId });
  return tasks;
}

/**
 * Updates the status of a specific reminder notification.
 */
export async function completeReminderNotificationAction(
   notificationId: string, 
   userId: string, 
   skipped: boolean = false,
   logDetails?: any // Optional log details to store
): Promise<{ success: boolean; error?: string; }> { 
   const supabase = await createClient();
   const newStatus = skipped ? 'skipped' : 'completed';
   logger.info('Completing reminder notification', { notificationId, userId, newStatus, logDetails });

   try {
        const updateData: Partial<Database['public']['Tables']['reminder_notifications']['Update']> = {
            status: newStatus,
            completed_or_skipped_at: new Date().toISOString(),
            log_details: logDetails || null
        };

        const { error } = await supabase
            .from('reminder_notifications')
            .update(updateData)
            .eq('id', notificationId)
            .eq('user_id', userId)
            .eq('status', 'pending'); // Important: Only update pending notifications

        if (error) {
            logger.error("Error updating reminder notification status", { notificationId, userId, error });
            // Check if the notification wasn't pending (already completed/skipped?)
            if (error.code === 'PGRST116') { // PostgREST error for no rows updated (might indicate status wasn't pending)
                 return { success: false, error: "Notification might have already been processed." };
            }
            return { success: false, error: "Could not update the notification status." };
        }
        
        // Revalidate relevant paths. Revalidating the inbox path is key.
        revalidatePath(`/components/patient/TrackingInbox`); 
        revalidatePath(`/patient/dashboard`);

        logger.info("Reminder notification completed successfully", { notificationId, newStatus });
        return { success: true }; 

   } catch (error) {
       logger.error('Failed in completeReminderNotificationAction', { notificationId, error: error instanceof Error ? error.message : String(error) });
       return { success: false, error: error instanceof Error ? error.message : "An unknown error occurred." };
   }
} 