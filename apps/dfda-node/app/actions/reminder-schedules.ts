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

// Get all reminder schedules for a user variable
export async function getReminderSchedulesForUserVariableAction(userVariableId: string): Promise<ReminderSchedule[]> {
    const supabase = await createClient();
    logger.info('Fetching reminder schedules', { userVariableId });

    if (!userVariableId) {
        logger.warn('getReminderSchedulesForUserVariableAction called with no userVariableId');
        return [];
    }

    const { data, error } = await supabase
        .from('reminder_schedules')
        .select('*')
        .eq('user_variable_id', userVariableId)
        .order('created_at', { ascending: true });

    if (error) {
        logger.error('Error fetching reminder schedules', { userVariableId, error });
        throw new Error('Could not fetch reminder schedules.');
    }
    return data || [];
}

// Upsert a reminder schedule for a user variable
export async function upsertReminderScheduleAction(
    userVariableId: string,
    scheduleData: ReminderScheduleClientData,
    userId: string, // Pass userId for validation
    scheduleIdToUpdate?: string | null // Optional ID if updating a specific schedule
): Promise<{ success: boolean; data?: ReminderSchedule; error?: string; message?: string }> {
    const supabase = await createClient();
    logger.info('Upserting reminder schedule', { userVariableId, scheduleIdToUpdate, isActive: scheduleData.isActive });

    // Validation
    if (!userVariableId) {
        return { success: false, error: 'User Variable ID is required.' };
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
                logger.info('No future occurrences found for rule', { userVariableId, scheduleIdToUpdate });
                nextTriggerAtIso = null;
            }
        } else {
            // Schedule is inactive
            logger.info('Schedule is inactive, setting next_trigger_at to null', { userVariableId, scheduleIdToUpdate });
            nextTriggerAtIso = null;
        }


        const dbData: ReminderScheduleDbData & { user_id: string } = {
            user_id: userId,
            user_variable_id: userVariableId,
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
            logger.error('Error upserting reminder schedule', { error: response.error, userVariableId });
            throw response.error;
        }

        logger.info('Successfully upserted reminder schedule', { scheduleId: response.data.id });

        // Revalidate paths (could be more specific if needed)
        revalidatePath('/patient/reminders'); // Assuming a general reminders page
        // revalidatePath(`/patient/variables/${userVariableId}`);

        return { success: true, data: response.data, message: 'Reminder schedule saved.' };

    } catch (error) {
        logger.error("Failed in upsertReminderScheduleAction", { userVariableId, error: error instanceof Error ? error.message : String(error) });
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