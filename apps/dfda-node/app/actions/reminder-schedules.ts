"use server"

import { logger } from "@/lib/logger"
import { createClient } from "@/lib/supabase/server"
// @ts-ignore - Suppress module not found error
import { RRule, RRuleSet, rrulestr } from 'rrule' // Import rrule for potential server-side use
import { toZonedTime, format } from 'date-fns-tz' // Correct imports
import { parse } from 'date-fns' // Import parse from date-fns
import type { Database } from '@/lib/database.types'
import { handleDatabaseResponse } from '@/lib/actions-helpers'
import { revalidatePath } from 'next/cache'

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
    let rule: RRule;
    try {
        // Validate RRULE string basic structure and parse it
        rule = rrulestr(scheduleData.rruleString) as RRule;
    } catch (e) {
        logger.error('Invalid RRULE string provided', { rruleString: scheduleData.rruleString, error: e });
        return { success: false, error: 'Invalid recurrence rule format.' };
    }

    try {
        let nextTriggerAtIso: string | null = null;

        if (scheduleData.isActive) {
            // Calculate next trigger time only if active
            const now = new Date(); // Current time in system timezone (UTC on server)

            // Get the time parts H:mm
            const [hours, minutes] = scheduleData.timeOfDay.split(':').map(Number);

            // Important: RRULE's dtstart ALREADY includes the date. We need to combine THIS date
            // with the SPECIFIED timeOfDay in the correct timezone.
            // The `dtstart` within the rule options is already a Date object parsed by rrule.js
            const dtstart = rule.options.dtstart;

            // Create the "base" datetime for occurrences in the target timezone
            // NOTE: The date part comes from dtstart, time part comes from timeOfDay input
            const baseDateTimeInTargetTz = new Date(dtstart);
            baseDateTimeInTargetTz.setHours(hours, minutes, 0, 0); // Set HH:mm from input, clear seconds/ms

            // Reconstruct options carefully for clarity and robustness.

            const options = {
                ...rule.options,
                // Ensure dtstart is the date part + timeOfDay in the correct timezone, then converted to UTC
                // dtstart must be a Date object representing the UTC time.
                dtstart: toZonedTime(baseDateTimeInTargetTz, scheduleData.timezone), // Convert base time in target zone TO UTC
                tzid: scheduleData.timezone, // Ensure tzid is explicitly set for calculation
            };

             // Recreate the rule with potentially adjusted dtstart/tzid for calculation
            const calculationRule = new RRule(options);

            // Find the next occurrence *after* the current time.
            // Get current time as UTC
            const nowUtc = new Date();
            // The RRule calculation needs the comparison time in UTC as well.
            const nextOccurrenceUtc = calculationRule.after(nowUtc);


            if (nextOccurrenceUtc) {
                // The result from rrule.after is already a UTC date object if tzid was used
                nextTriggerAtIso = nextOccurrenceUtc.toISOString();
                logger.info('Calculated next trigger time', { nextTriggerAtIso, timezone: scheduleData.timezone });
            } else {
                // No future occurrences found (rule ended or invalid)
                logger.info('No future occurrences found for rule', { globalVariableId, scheduleIdToUpdate });
                nextTriggerAtIso = null;
            }
        } else {
            // Schedule is inactive
            logger.info('Schedule is inactive, setting next_trigger_at to null', { globalVariableId, scheduleIdToUpdate });
            nextTriggerAtIso = null;
        }


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
    logger.warn('Deleting reminder schedule', { scheduleId, userId });

    if (!scheduleId) {
        return { success: false, error: 'Schedule ID is required.' };
    }

    try {
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
  globalVariableId: string,
  variableName: string, // e.g., "Diabetes Type 2" or "Metformin"
  reminderType: 'condition' | 'treatment' // To customize messages
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  logger.info('Creating default reminder', { userId, globalVariableId, variableName, reminderType });

  if (!userId || !globalVariableId || !variableName) {
    return { success: false, error: 'Missing required information for default reminder.' };
  }

  // --- Define Default Settings --- 
  const defaultTime = "19:00"; // 7 PM
  const defaultTimezone = "America/New_York"; // TODO: Get user's actual timezone from profile!
  const defaultRRule = `FREQ=DAILY;DTSTART=${new Date().toISOString().split('T')[0].replace(/-/g, '')}T000000Z`; // Daily starting today (UTC date part)
  const defaultTitle = reminderType === 'condition' 
                         ? `Track ${variableName} Severity` 
                         : `Track ${variableName} Adherence`;
  const defaultMessage = reminderType === 'condition'
                         ? `How has your ${variableName} been today?`
                         : `Did you take your ${variableName} today? How effective was it?`;
  // --- End Default Settings --- 
  
  try {
    // Simplified data for insertion - calculation of next_trigger_at handled by upsert action logic
    // We need to call upsert instead of direct insert to leverage that logic
    const scheduleData: ReminderScheduleClientData = {
        rruleString: defaultRRule,
        timeOfDay: defaultTime,
        timezone: defaultTimezone, // Use default for now
        startDate: new Date(), // Start today
        isActive: true,
    };

    // Call the existing upsert action to handle RRULE parsing and next_trigger_at calculation
    // We are *inserting*, so no scheduleIdToUpdate is provided.
    const result = await upsertReminderScheduleAction(
        globalVariableId,
        scheduleData,
        userId
        // scheduleIdToUpdate is omitted for insertion
    );

    if (!result.success || !result.data) {
      logger.error('Failed to create default reminder via upsert', { userId, globalVariableId, error: result.error });
      return { success: false, error: result.error || 'Failed to create default reminder.' };
    }

    // Optionally, update the title/message templates if the upsert action doesn't handle them
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

    logger.info('Successfully created default reminder', { userId, globalVariableId, scheduleId: result.data.id });
    return { success: true };

  } catch (error) {
    logger.error('Error in createDefaultReminderAction', { userId, globalVariableId, error: error instanceof Error ? error.message : String(error) });
    return { success: false, error: 'An unexpected error occurred while creating the default reminder.' };
  }
} 

// --- Tracking Inbox Action --- 

// Define the structure for a pending task
export type PendingReminderTask = {
  scheduleId: string;
  userVariableId: string;
  variableName: string;
  title: string | null;
  message: string | null;
  dueAt: string; // The original next_trigger_at timestamp
  timeOfDay: string;
  timezone: string;
  rrule: string;
};

/**
 * Fetches active reminder schedules for a user that are currently due.
 */
export async function getPendingReminderTasksAction(
  userId: string
): Promise<PendingReminderTask[]> {
  const supabase = await createClient();
  logger.info('Fetching pending reminder tasks', { userId });

  const now = new Date().toISOString();

  // Fetch active schedules due now or in the past
  const { data: schedules, error } = await supabase
    .from('reminder_schedules')
    .select(`
      id,
      user_variable_id,
      notification_title_template,
      notification_message_template,
      next_trigger_at,
      time_of_day,
      timezone,
      rrule,
      user_variable:user_variables!inner(
        name
      )
    `)
    .eq('user_id', userId)
    .eq('is_active', true)
    .lte('next_trigger_at', now) // Due now or earlier
    .not('next_trigger_at', 'is', null) // Must have a trigger time
    .order('next_trigger_at', { ascending: true });

  if (error) {
    logger.error('Error fetching pending reminder schedules', { userId, error });
    console.error("Supabase fetch error (pending reminders):", JSON.stringify(error, null, 2));
    // Return empty array on error instead of throwing, page can still load
    return []; 
  }

  if (!schedules) {
    return [];
  }

  // Map to the defined task structure
  const tasks: PendingReminderTask[] = schedules.map(s => ({
    scheduleId: s.id,
    userVariableId: s.user_variable_id,
    // Handle potential null user_variable - though inner join should prevent this
    variableName: s.user_variable?.name || 'Unknown Item',
    title: s.notification_title_template,
    message: s.notification_message_template,
    // Ensure next_trigger_at is treated as string
    dueAt: s.next_trigger_at as string, 
    timeOfDay: s.time_of_day,
    timezone: s.timezone,
    rrule: s.rrule,
  }));

  logger.info(`Found ${tasks.length} pending reminder tasks`, { userId });
  return tasks;
}

// TODO: Implement action to mark task as done/skipped and calculate next trigger
export async function completeReminderTaskAction(
   scheduleId: string, 
   userId: string, 
   skipped: boolean = false,
   logData?: any // Optional data from the log action (e.g., rating value)
): Promise<{ success: boolean; error?: string }> {
   logger.info('Completing reminder task (Placeholder)', { scheduleId, userId, skipped, logData });
   // 1. Fetch the schedule using scheduleId and userId
   // 2. If found, calculate the *next* next_trigger_at based on its rrule, time_of_day, timezone
   //    using logic similar to upsertReminderScheduleAction
   // 3. Update the schedule record with the new next_trigger_at
   // 4. Optionally, log the completion/skip event (e.g., in measurements or a dedicated log table)
   await new Promise(resolve => setTimeout(resolve, 500)); // Simulate async work
   console.log(`---> Placeholder: Task ${scheduleId} marked as ${skipped ? 'skipped' : 'done'}. New trigger time needs calculation.`);
   // Revalidate relevant paths
   revalidatePath(`/patient`);
   return { success: true }; // Placeholder return
} 