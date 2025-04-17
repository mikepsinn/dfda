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
// Import graphile-worker helper
import { quickAddJob } from 'graphile-worker';
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories'

// Types
export type ReminderSchedule = Database['public']['Tables']['reminder_schedules']['Row']
// Type for data coming from the client component
export type ReminderScheduleClientData = {
  rruleString: string;
  timeOfDay: string; // HH:mm
  startDate: Date; // Client sends Date object
  endDate?: Date | null;
  isActive: boolean;
  default_value?: number | null;
}
// Type for inserting/updating in the database
export type ReminderScheduleDbData = Omit<Database['public']['Tables']['reminder_schedules']['Insert'], 'id' | 'created_at' | 'updated_at' | 'next_trigger_at'> & {
    // We might allow updating next_trigger_at separately later
    next_trigger_at?: string | null;
}

// --- Server Actions ---

// Get all reminder schedules for a specific user and global variable concept
export async function getReminderSchedulesForUserVariableAction(
  userId: string, 
  globalVariableId: string
): Promise<ReminderSchedule[]> {
    const supabase = await createClient();
    logger.info('Fetching reminder schedules for user variable', { userId, globalVariableId });

    if (!userId || !globalVariableId) {
        logger.warn('getReminderSchedulesForUserVariableAction called with missing IDs', { userId, globalVariableId });
        return [];
    }

    // 1. Find the specific user_variable record for this user and global variable
    const { data: userVariable, error: uvError } = await supabase
        .from('user_variables')
        .select('id')
        .eq('user_id', userId)
        .eq('global_variable_id', globalVariableId)
        .maybeSingle();

    if (uvError) {
        // Log error but don't necessarily throw, maybe the user just doesn't track it
        logger.error('Error fetching user_variable for reminders', { userId, globalVariableId, error: uvError });
        // If the error indicates an invalid UUID format for globalVariableId, we might have a data issue elsewhere
        if (uvError.code === '22P02') {
             logger.error('Potential data issue: globalVariableId passed is not a valid UUID if expected.', { globalVariableId });
        }
        // Return empty rather than throwing, as the user might not have this variable setup
        return []; 
    }

    if (!userVariable) {
        logger.info('No user_variable found for this user/global variable combination.', { userId, globalVariableId });
        return []; // No user variable means no reminders
    }

    const userVariableId = userVariable.id;
    logger.info('Found user_variable_id, fetching schedules', { userVariableId });

    // 2. Fetch reminder schedules using the found user_variable.id
    const { data, error } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('user_variable_id', userVariableId) // Use the correct ID now
        .order('created_at', { ascending: true });

    if (error) {
        logger.error('Error fetching reminder schedules using user_variable_id', { userVariableId, error });
        throw new Error('Could not fetch reminder schedules.');
    }
    return data || [];
}

/**
 * Gets all reminder schedules for a user, joining with user_variables and global_variables
 * to get the variable name and other details
 */
export async function getAllReminderSchedulesForUserAction(userId: string): Promise<any[]> {
    const supabase = await createClient();
    logger.info('Fetching all reminder schedules for user', { userId });

    if (!userId) {
        logger.warn('getAllReminderSchedulesForUserAction called with missing userId');
        return [];
    }

    // Fetch schedules with joined data
    const { data, error } = await supabase
        .from('reminder_schedules')
        .select(`
            id,
            is_active,
            time_of_day,
            rrule,
            start_date,
            end_date,
            default_value,
            user_variables!inner (
                id,
                global_variable_id,
                global_variables (
                    id,
                    name,
                    emoji,
                    variable_category_id,
                    default_unit_id,
                    default_unit:default_unit_id(
                        id,
                        abbreviated_name
                    )
                ),
                preferred_unit_id,
                units:preferred_unit_id (
                    id, 
                    abbreviated_name
                )
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        logger.error('Error fetching all reminder schedules for user', { userId, error });
        return [];
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

    // --- Get DB Connection String for Worker ---
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        logger.error("DATABASE_URL environment variable is not set for worker job enqueuing in upsertReminderScheduleAction");
        // Return error immediately if connection string is missing
        return { success: false, error: "Server configuration error (DB URL missing)." };
    }
    // --- End DB Connection String ---

    // Validation
    // --- Add Logging Here ---
    logger.info('[UPSERT-ACTION] Received data', { 
        scheduleData: scheduleData, 
        receivedTimeOfDay: scheduleData?.timeOfDay 
    });
    // --- End Logging ---

    if (!globalVariableId) {
        return { success: false, error: 'Global Variable ID is required.' };
    }
    // Log the value being checked AND the result of the regex match
    const timeCheckValue = scheduleData?.timeOfDay;
    const isTimeFormatValid = typeof timeCheckValue === 'string' && timeCheckValue.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    logger.info('[UPSERT-ACTION] Validating timeOfDay', { 
        timeToCheck: timeCheckValue, 
        isFormatValid: !!isTimeFormatValid // Coerce to boolean for clarity
    });

    if (!isTimeFormatValid) { 
        logger.warn('[UPSERT-ACTION] Time format validation failed', { receivedTimeOfDay: timeCheckValue });
        return { success: false, error: 'Invalid time format (HH:mm required).' };
    }
    try {
        // Validate RRULE string basic structure and parse it
        /* rule = */ rrulestr(scheduleData.rruleString) as RRule; // Removed unused assignment
    } catch (e) {
        logger.error('[UPSERT-ACTION] Invalid RRULE string provided', { rruleString: scheduleData.rruleString, error: e });
        return { success: false, error: 'Invalid recurrence rule format.' };
    }

    try {
        let nextTriggerAtIso: string | null = null;
        let userTimezone: string | undefined;

        // --- Determine user timezone (needed for next_trigger_at calculation) ---
        // Fetch timezone regardless of isActive, needed for RRULE parsing with TZID
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('timezone')
            .eq('id', userId)
            .single();

        if (profileError || !profile?.timezone) {
            logger.error('Could not fetch user profile timezone for next_trigger calculation/RRULE parsing', { userId, error: profileError });
            userTimezone = 'UTC'; // Fallback to UTC
        } else {
            userTimezone = profile.timezone;
        }
        // --- End Determine user timezone ---

        // --- Determine next_trigger_at ---
        if (scheduleData.isActive) {
            try {
                const rule = rrulestr(scheduleData.rruleString) as RRule;
                const nowUtc = new Date();
                const [hours, minutes] = scheduleData.timeOfDay.split(':').map(Number);

                // DTSTART handling: Prefer RRULE's DTSTART if available, else use scheduleData.startDate
                let dtstartSource: Date;
                if (rule.options.dtstart instanceof Date) {
                    dtstartSource = rule.options.dtstart;
                } else if (scheduleData.startDate instanceof Date) {
                    dtstartSource = scheduleData.startDate;
                } else {
                    logger.warn('Could not determine valid Date object for dtstart, using current time as fallback.', { ruleDtstart: rule.options.dtstart, scheduleStartDate: scheduleData.startDate });
                    dtstartSource = new Date(); // Less ideal fallback
                }

                // Ensure time is applied correctly to the start date for calculation
                const dtstartWithTime = new Date(dtstartSource);
                dtstartWithTime.setHours(hours, minutes, 0, 0);

                const options = {
                    ...rule.options,
                    // Ensure dtstart is a Date object before passing to toZonedTime
                    dtstart: toZonedTime(dtstartWithTime, userTimezone), // Convert start to user's timezone
                    tzid: userTimezone, // Ensure timezone is explicit in options
                };
                const calculationRule = new RRule(options);
                const nowInTargetTz = toZonedTime(nowUtc, userTimezone); // Use current time in user's timezone
                const nextOccurrence = calculationRule.after(nowInTargetTz, true); // Find next occurrence after now

                if (nextOccurrence) {
                    // Convert the JSDate result (which is in user's TZ context) back to UTC ISO string
                    nextTriggerAtIso = DateTime.fromJSDate(nextOccurrence).setZone(userTimezone).toUTC().toISO();
                    logger.info('Calculated next trigger time for active schedule', { nextTriggerAtIso, timezone: userTimezone });
                } else {
                    logger.info('No future occurrences found for active rule', { globalVariableId, scheduleIdToUpdate });
                    nextTriggerAtIso = null; // Explicitly null if no future dates
                }
            } catch (ruleError) {
                 logger.error('Error calculating next trigger time', { scheduleIdToUpdate, rruleString: scheduleData.rruleString, error: ruleError });
                 nextTriggerAtIso = null; // Default to null on error
            }
        } else {
            // If schedule is inactive, clear the next trigger time
            logger.info('Schedule is inactive, setting next_trigger_at to null', { globalVariableId, scheduleIdToUpdate });
            nextTriggerAtIso = null;
        }
        // --- End Determine next_trigger_at ---


        const dbData: Omit<ReminderScheduleDbData, 'next_trigger_at'> & { user_id: string; next_trigger_at?: string | null } = {
            user_id: userId,
            user_variable_id: globalVariableId,
            is_active: scheduleData.isActive,
            rrule: scheduleData.rruleString,
            time_of_day: scheduleData.timeOfDay,
            start_date: scheduleData.startDate.toISOString(), // Store start date as sent by client
            end_date: scheduleData.endDate ? scheduleData.endDate.toISOString() : null,
            next_trigger_at: nextTriggerAtIso, // Assign calculated value here
            default_value: scheduleData.default_value, // Include default_value
            // notification_title_template: ..., // Add if needed
            // notification_message_template: ..., // Add if needed
        };

        let response;
        let savedScheduleId: string | undefined;

        if (scheduleIdToUpdate) {
            // === UPDATE ===
            logger.info('[UPSERT-UPDATE] Starting update process', { scheduleIdToUpdate });
            response = await supabase
                .from('reminder_schedules')
                .update(dbData)
                .eq('id', scheduleIdToUpdate)
                .eq('user_id', userId)
                .select()
                .single();
            
            if (response.error) {
                 logger.error('[UPSERT-UPDATE] Database update failed', { scheduleIdToUpdate, error: response.error });
                 // Error will be thrown later
            } else if (response.data) {
                savedScheduleId = response.data.id;
                logger.info('[UPSERT-UPDATE] DB update successful', { savedScheduleId });
                // Only proceed if we have a valid ID
                if (savedScheduleId) { 
                    logger.info('[UPSERT-UPDATE] Proceeding with cleanup/requeue', { savedScheduleId });
                    
                    // --- Delete Future Pending Notifications ---
                    logger.info('[UPSERT-UPDATE] Deleting future pending notifications', { savedScheduleId });
                    const { error: deleteError } = await supabase
                        .from('reminder_notifications')
                        .delete()
                        .eq('reminder_schedule_id', savedScheduleId)
                        .eq('status', 'pending')
                        .gt('notification_trigger_at', new Date().toISOString());

                    if (deleteError) {
                        logger.warn('[UPSERT-UPDATE] Failed to delete future pending notifications (continuing...)', { savedScheduleId, error: deleteError });
                    } else {
                        logger.info('[UPSERT-UPDATE] Successfully deleted future pending notifications', { savedScheduleId });
                    }
                    // --- End Deletion ---

                    // --- Enqueue Worker Job to Regenerate First Notification ---
                    // Ensure connectionString is available (checked earlier, but good practice)
                    if (!connectionString) {
                         logger.error('[UPSERT-UPDATE] CRITICAL: Connection string missing before enqueue attempt!');
                         // Potentially return an error here or rely on earlier check
                    } else {
                        try {
                            logger.info('[UPSERT-UPDATE] Attempting to enqueue processSingleSchedule job', { savedScheduleId, connectionString: '****' }); // Mask connection string in logs
                            await quickAddJob(
                                { connectionString }, 
                                'processSingleSchedule', 
                                { scheduleId: savedScheduleId } 
                            );
                            logger.info('[UPSERT-UPDATE] Successfully enqueued processSingleSchedule job', { savedScheduleId });
                        } catch (enqueueError) {
                            logger.error('[UPSERT-UPDATE] Error enqueuing processSingleSchedule job', {
                                savedScheduleId,
                                error: enqueueError instanceof Error ? enqueueError.message : String(enqueueError)
                            });
                            // Log error but don't fail the user-facing operation
                        }
                    }
                    // --- End Enqueue ---
                } else {
                     logger.error('[UPSERT-UPDATE] Update response missing schedule ID, cannot enqueue job', { scheduleIdToUpdate, responseData: response.data });
                }
            } else {
                 // This case should ideally not happen if there's no error but also no data
                 logger.warn('[UPSERT-UPDATE] DB update returned no error and no data', { scheduleIdToUpdate });
            }
        } else {
            // === INSERT ===
            logger.info('Inserting new schedule');
            response = await supabase
                .from('reminder_schedules')
                .insert(dbData)
                .select()
                .single();
            if (!response.error && response.data) {
                savedScheduleId = response.data.id;
                 // Only proceed if we have a valid ID
                if (savedScheduleId) {
                    // --- Enqueue Worker Job for NEW schedule ---
                     try {
                        logger.info('Enqueuing processSingleSchedule job for NEW schedule', { savedScheduleId });
                        await quickAddJob(
                            { connectionString }, 
                            'processSingleSchedule', 
                            { scheduleId: savedScheduleId } // Now guaranteed to be string
                        );
                        logger.info('Successfully enqueued processSingleSchedule job for new schedule', { savedScheduleId });
                    } catch (enqueueError) {
                        logger.error('Error enqueuing processSingleSchedule job after insert', {
                            savedScheduleId,
                            error: enqueueError instanceof Error ? enqueueError.message : String(enqueueError)
                        });
                    }
                    // --- End Enqueue ---
                } else {
                    logger.error('Insert response missing schedule ID', { responseData: response.data });
                }
            }
        }

        if (response.error) {
            logger.error('Error upserting reminder schedule in DB', { error: response.error, globalVariableId, scheduleIdToUpdate });
            throw response.error;
        }

        // Check if data exists before accessing it
        if (!response.data) {
             logger.error('Upsert operation did not return data', { globalVariableId, scheduleIdToUpdate });
             throw new Error('Failed to save schedule data.');
        }

        logger.info('Successfully upserted reminder schedule DB record', { scheduleId: response.data.id });

        // Revalidate paths (could be more specific if needed)
        revalidatePath('/patient/reminders'); 
        revalidatePath(`/patient/variables/${globalVariableId}`); // Assuming this path exists

        return { success: true, data: response.data, message: 'Reminder schedule saved.' };

    } catch (error) {
        logger.error("Failed in upsertReminderScheduleAction", { globalVariableId, scheduleIdToUpdate, error: error instanceof Error ? error.message : String(error) });
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
  userVariableId: string,
  variableName: string,
  variableCategory: string | null // Pass category to determine message
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  logger.info('Creating default reminder', { userId, userVariableId, variableName });

  if (!userId || !userVariableId || !variableName) {
    return { success: false, error: 'Missing required information for default reminder.' };
  }

  // Get connection string (required for quickAddJob)
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
      logger.error("DATABASE_URL environment variable is not set for worker job enqueuing");
      return { success: false, error: "Server configuration error (DB URL missing)." };
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
    const defaultTitle = variableCategory === VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS
                         ? `Track ${variableName} Adherence` 
                         : `Track ${variableName}`; // Generic title otherwise
    const defaultMessage = variableCategory === VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS
                         ? `Did you take your ${variableName} today?`
                         : `How was your ${variableName} today?`; // Generic message
    // --- End Default Settings --- 
  
    // Simplified data for insertion - calculation of next_trigger_at handled by upsert action logic
    // We need to call upsert instead of direct insert to leverage that logic
    const scheduleData: ReminderScheduleClientData = {
        rruleString: defaultRRule,
        timeOfDay: defaultTime,
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

    const newScheduleId = result.data.id;
    logger.info('Successfully created default reminder schedule', { scheduleId: newScheduleId, userId, userVariableId });

    // --- Add job using graphile-worker library --- 
    try {
        logger.info('Enqueuing processSingleSchedule job via quickAddJob', { scheduleId: newScheduleId });
        await quickAddJob(
            { connectionString }, // Options object with connection string
            'processSingleSchedule', // Task identifier
            { scheduleId: newScheduleId } // Payload
        );
        logger.info('Successfully enqueued processSingleSchedule job', { scheduleId: newScheduleId });

    } catch (enqueueError) {
        logger.error('Error enqueuing processSingleSchedule job via quickAddJob', {
            scheduleId: newScheduleId,
            error: enqueueError instanceof Error ? enqueueError.message : String(enqueueError)
        });
        // Decide if failure to enqueue should fail the whole action
        // For now, let's return success but log the error
        // return { success: false, error: "Failed to schedule background job." };
    }
    // --- End Add job via library ---

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