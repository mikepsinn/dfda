"use server"

import type { Database } from '@/lib/database.types'
import { Prisma, isRecordNotFound } from '@/lib/db'
import { getUserDb } from '@/lib/db/server'
import { timeOfDayFromString, timeOfDayToString } from '@/lib/time-of-day'
import { RRule, rrulestr } from 'rrule'
import { DateTime } from 'luxon'
import { toZonedTime } from 'date-fns-tz'
import { logger } from '@/lib/logger'
import { revalidatePath } from 'next/cache'
// REMOVE the Trigger.dev client import
// import { client } from '@/lib/trigger' 
// Import graphile-worker helper
import { quickAddJob } from 'graphile-worker';
import { VARIABLE_CATEGORY_IDS } from '@/lib/constants/variable-categories'
import { getUserProfile } from "@/lib/profile"; // Import profile helper
import { getServerUser } from "@/lib/server-auth"; // Import if needed for user context

// Types
type ReminderScheduleRow = Database['public']['Tables']['reminder_schedules']['Row']
// time_of_day is returned to callers as an 'HH:MM:SS' string
export type ReminderSchedule = Omit<ReminderScheduleRow, 'time_of_day'> & { time_of_day: string }
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
export type ReminderScheduleDbData = Omit<
    Prisma.reminder_schedulesUncheckedCreateInput,
    'id' | 'created_at' | 'updated_at' | 'reminder_notifications'
>

function toReminderSchedule(row: ReminderScheduleRow): ReminderSchedule {
    return { ...row, time_of_day: timeOfDayToString(row.time_of_day) };
}

// --- Server Actions ---

// Get all reminder schedules for a specific user variable ID
export async function getReminderSchedulesForUserVariableAction(
  userId: string, 
  userVariableId: string
): Promise<ReminderSchedule[]> {
    logger.info('Fetching reminder schedules for user variable', { userId, userVariableId });

    if (!userId || !userVariableId) {
        logger.warn('getReminderSchedulesForUserVariableAction called with missing IDs', { userId, userVariableId });
        return [];
    }

    try {
        const db = await getUserDb();
        // Fetch reminder schedules directly using the provided user_variable_id
        const schedules = await db.reminder_schedules.findMany({
            where: {
                user_id: userId, // Still ensure it belongs to the user
                user_variable_id: userVariableId,
            },
            orderBy: { created_at: 'asc' },
        });
        return schedules.map(toReminderSchedule);
    } catch (error) {
        logger.error('Error fetching reminder schedules using user_variable_id', { userVariableId, userId, error });
        // Consider throwing or returning an error object if fetch fails critically
        return []; // Return empty on error for now
    }
}

/**
 * Gets all reminder schedules for a user, joining with user_variables and global_variables
 * to get the variable name and other details
 */
export async function getAllReminderSchedulesForUserAction(userId: string): Promise<any[]> {
    logger.info('Fetching all reminder schedules for user', { userId });

    if (!userId) {
        logger.warn('getAllReminderSchedulesForUserAction called with missing userId');
        return [];
    }

    try {
        const db = await getUserDb();
        // Fetch schedules with joined data
        const schedules = await db.reminder_schedules.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            select: {
                id: true,
                is_active: true,
                time_of_day: true,
                rrule: true,
                start_date: true,
                end_date: true,
                default_value: true,
                user_variables: {
                    select: {
                        id: true,
                        global_variable_id: true,
                        global_variables: {
                            select: {
                                id: true,
                                name: true,
                                emoji: true,
                                variable_category_id: true,
                                default_unit_id: true,
                                units: { select: { id: true, abbreviated_name: true } },
                            },
                        },
                        preferred_unit_id: true,
                        units: { select: { id: true, abbreviated_name: true } },
                    },
                },
            },
        });

        return schedules.map(({ time_of_day, user_variables, ...schedule }) => {
            const { units: default_unit, ...globalVariable } = user_variables.global_variables;
            return {
                ...schedule,
                time_of_day: timeOfDayToString(time_of_day),
                user_variables: {
                    ...user_variables,
                    global_variables: { ...globalVariable, default_unit },
                },
            };
        });
    } catch (error) {
        logger.error('Error fetching all reminder schedules for user', { userId, error });
        return [];
    }
}

// Upsert a reminder schedule for a specific user variable
export async function upsertReminderScheduleAction(
    userVariableId: string,
    scheduleData: ReminderScheduleClientData,
    userId: string,
    scheduleIdToUpdate?: string | null
): Promise<{ success: boolean; data?: ReminderSchedule; error?: string; message?: string }> {
    logger.info('Upserting reminder schedule', { userVariableId, scheduleIdToUpdate, isActive: scheduleData.isActive });

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

    if (!userVariableId) {
        return { success: false, error: 'User Variable ID is required.' };
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
        const user = await getServerUser(); // Get user object to pass to getUserProfile
        if (!user) {
            logger.error('upsertReminderScheduleAction: Could not get authenticated user.', { userId });
            return { success: false, error: 'Authentication error.' };
        }

        // --- Determine user timezone (needed for next_trigger_at calculation) ---
        const profile = await getUserProfile(user);
        if (!profile?.timezone) {
            logger.error('Could not fetch user profile timezone for next_trigger calculation/RRULE parsing', { userId });
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
                    logger.info('No future occurrences found for active rule', { userVariableId, scheduleIdToUpdate });
                    nextTriggerAtIso = null; // Explicitly null if no future dates
                }
            } catch (ruleError) {
                 logger.error('Error calculating next trigger time', { scheduleIdToUpdate, rruleString: scheduleData.rruleString, error: ruleError });
                 nextTriggerAtIso = null; // Default to null on error
            }
        } else {
            // If schedule is inactive, clear the next trigger time
            logger.info('Schedule is inactive, setting next_trigger_at to null', { userVariableId, scheduleIdToUpdate });
            nextTriggerAtIso = null;
        }
        // --- End Determine next_trigger_at ---


        const dbData: ReminderScheduleDbData = {
            user_id: userId,
            user_variable_id: userVariableId,
            is_active: scheduleData.isActive,
            rrule: scheduleData.rruleString,
            time_of_day: timeOfDayFromString(scheduleData.timeOfDay),
            start_date: scheduleData.startDate, // Store start date as sent by client
            end_date: scheduleData.endDate ?? null,
            default_value: scheduleData.default_value,
            next_trigger_at: nextTriggerAtIso ? new Date(nextTriggerAtIso) : null,
        };

        const db = await getUserDb();
        let savedSchedule: ReminderScheduleRow;
        try {
            if (scheduleIdToUpdate) {
                logger.info('[UPSERT-UPDATE] Starting update process', { scheduleIdToUpdate });
                savedSchedule = await db.reminder_schedules.update({
                    where: { id: scheduleIdToUpdate, user_id: userId },
                    data: dbData,
                });
            } else {
                logger.info('Inserting new schedule');
                savedSchedule = await db.reminder_schedules.create({ data: dbData });
            }
        } catch (error) {
            logger.error('Error upserting reminder schedule in DB', { error, userVariableId, scheduleIdToUpdate });
            if (isRecordNotFound(error)) {
                return { success: false, error: 'Reminder schedule not found.' };
            }
            throw error;
        }
        const savedScheduleId = savedSchedule.id;

        if (scheduleIdToUpdate) {
            // === UPDATE ===
            logger.info('[UPSERT-UPDATE] DB update successful, proceeding with cleanup/requeue', { savedScheduleId });

            // --- Delete Future Pending Notifications ---
            logger.info('[UPSERT-UPDATE] Deleting future pending notifications', { savedScheduleId });
            try {
                await db.reminder_notifications.deleteMany({
                    where: {
                        reminder_schedule_id: savedScheduleId,
                        status: 'pending',
                        notification_trigger_at: { gt: new Date() },
                    },
                });
                logger.info('[UPSERT-UPDATE] Successfully deleted future pending notifications', { savedScheduleId });
            } catch (deleteError) {
                logger.warn('[UPSERT-UPDATE] Failed to delete future pending notifications (continuing...)', { savedScheduleId, error: deleteError });
            }
            // --- End Deletion ---

            // --- Enqueue Worker Job to Regenerate First Notification ---
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
            // --- End Enqueue ---
        } else {
            // === INSERT ===
            // --- Enqueue Worker Job for NEW schedule ---
            try {
                logger.info('Enqueuing processSingleSchedule job for NEW schedule', { savedScheduleId });
                await quickAddJob(
                    { connectionString },
                    'processSingleSchedule',
                    { scheduleId: savedScheduleId }
                );
                logger.info('Successfully enqueued processSingleSchedule job for new schedule', { savedScheduleId });
            } catch (enqueueError) {
                logger.error('Error enqueuing processSingleSchedule job after insert', {
                    savedScheduleId,
                    error: enqueueError instanceof Error ? enqueueError.message : String(enqueueError)
                });
            }
            // --- End Enqueue ---
        }

        logger.info('Successfully upserted reminder schedule DB record', { scheduleId: savedScheduleId });

        // Revalidate paths (could be more specific if needed)
        revalidatePath('/patient/reminders');
        revalidatePath(`/patient/user-variables/${userVariableId}`);

        return { success: true, data: toReminderSchedule(savedSchedule), message: 'Reminder schedule saved.' };

    } catch (error) {
        logger.error("Failed in upsertReminderScheduleAction", { userVariableId, scheduleIdToUpdate, error: error instanceof Error ? error.message : String(error) });
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { success: false, error: errorMessage };
    }
}

// Delete a specific reminder schedule
export async function deleteReminderScheduleAction(
    scheduleId: string,
    userId: string,
    userVariableId: string
): Promise<{ success: boolean; error?: string }> {
    logger.warn('Deleting reminder schedule and related notifications', { scheduleId, userId });

    if (!scheduleId) {
        return { success: false, error: 'Schedule ID is required.' };
    }

    try {
        const db = await getUserDb();
        // Deleting the schedule should cascade delete notifications due to FK constraint
        await db.reminder_schedules.deleteMany({
            where: {
                id: scheduleId,
                user_id: userId, // Ensure user owns the schedule
            },
        });

        logger.info('Successfully deleted reminder schedule', { scheduleId });
        revalidatePath('/patient/reminders'); // Revalidate general page
        revalidatePath('/patient/dashboard'); // Revalidate dashboard too
        revalidatePath(`/patient/user-variables/${userVariableId}`);
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
    logger.info('Creating default reminder', { userId, userVariableId, variableName });

    const user = await getServerUser(); // Get user object for profile fetching
    if (!user) {
        logger.error('createDefaultReminderAction: Could not get authenticated user.', { userId });
        return { success: false, error: 'Authentication error.' };
    }

    // --- Determine user timezone ---
    const profile = await getUserProfile(user);
    const userTimezone = profile?.timezone || 'UTC'; // Fallback to UTC if not found
    logger.info('Using timezone for default reminder', { userId, userTimezone });
    // --- End Determine user timezone ---

    // Determine start date based on user's timezone
    const nowInUserTz = DateTime.now().setZone(userTimezone);
    // Start date should be today in the user's timezone, no time component needed for RRULE dtstart DATE type
    const startDate: string | null = nowInUserTz.startOf('day').toISODate(); // Type explicitly

    if (!startDate) {
        logger.error('Could not generate start date for default reminder.', { userId });
        return { success: false, error: 'Internal error generating start date.' }
    }

    // Default RRULE: Daily at 9 AM
    const defaultTime = '09:00';
    // Ensure startDate is not null before replacing
    const defaultRruleString = `DTSTART;TZID=${userTimezone}:${startDate.replace(/-/g,'')}T090000\nRRULE:FREQ=DAILY`;

    // Default message based on category - Use correct constant names
    let message = `Time to log ${variableName}.`;
    if (variableCategory === VARIABLE_CATEGORY_IDS.INTAKE_AND_INTERVENTIONS) { // Keep treatment check
        message = `Did you take your ${variableName} dose?`;
    } // Add more specific messages if needed

    // Use the existing upsert logic (or a simplified insert if preferred)
    // For simplicity, let's call the core insert directly here
    // We need to calculate next_trigger_at similar to upsert
    let nextTriggerAtIso: string | null = null;
    try {
        const rule = rrulestr(defaultRruleString) as RRule;
        const nowUtc = new Date();
        const dtstartWithTime = DateTime.fromISO(startDate + 'T' + defaultTime, { zone: userTimezone }).toJSDate();

        const options = {
            ...rule.options,
            dtstart: toZonedTime(dtstartWithTime, userTimezone),
            tzid: userTimezone,
        };
        const calculationRule = new RRule(options);
        const nowInTargetTz = toZonedTime(nowUtc, userTimezone);
        const nextOccurrence = calculationRule.after(nowInTargetTz, true);
        if (nextOccurrence) {
            nextTriggerAtIso = DateTime.fromJSDate(nextOccurrence).setZone(userTimezone).toUTC().toISO();
        }
    } catch(e) {
        logger.error('Error calculating next trigger for default reminder', { userId, userVariableId, error: e });
        // Proceed without next_trigger_at? Or return error?
    }

    // Construct schedule data
    const scheduleDbData: ReminderScheduleDbData = {
        user_id: userId,
        user_variable_id: userVariableId,
        rrule: defaultRruleString,
        time_of_day: timeOfDayFromString(defaultTime),
        start_date: new Date(startDate), // UTC midnight of the user's current date
        is_active: true, 
        notification_message_template: message, 
        next_trigger_at: nextTriggerAtIso ? new Date(nextTriggerAtIso) : null,
        // Add other required fields from Insert type if necessary, e.g.:
        // default_value: null, // If applicable
        // notification_title_template: `Track ${variableName}`, // If applicable
    };

    let data: ReminderScheduleRow;
    try {
        const db = await getUserDb();
        data = await db.reminder_schedules.create({ data: scheduleDbData });
    } catch (error) {
        logger.error('Error inserting default reminder schedule', { userId, userVariableId, error });
        return { success: false, error: 'Could not create default reminder.' };
    }

    logger.info('Default reminder created successfully', { userId, userVariableId, scheduleId: data.id });

    // Revalidate relevant paths
    revalidatePath('/patient/reminders');
    revalidatePath(`/patient/reminders/${userVariableId}`);

    // --- Enqueue Worker Job --- 
    const connectionString = process.env.DATABASE_URL;
    if (connectionString && data.next_trigger_at) { 
        const triggerAt = data.next_trigger_at.toISOString();
        try {
            await quickAddJob(
                { connectionString }, // Worker options
                'schedule_next_notification', // Job identifier
                { scheduleId: data.id, triggerAt } // Payload
            );
            logger.info('Enqueued schedule_next_notification job for new default schedule', { scheduleId: data.id, triggerAt });
        } catch (workerError) {
            logger.error('Failed to enqueue schedule_next_notification job for new default schedule', { scheduleId: data.id, error: workerError });
            // Decide if this should cause the action to fail
        }
    } else if (!connectionString) {
         logger.error("DATABASE_URL not set, cannot enqueue worker job for default schedule");
    } else if (!data.next_trigger_at) {
         logger.warn("No next_trigger_at calculated, cannot enqueue worker job for default schedule", { scheduleId: data.id });
    }
    // --- End Enqueue Worker Job ---

    return { success: true };
} 

// --- Refactored Tracking Inbox Actions --- 

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

// Function completeReminderNotificationAction moved to lib/actions/reminder-notifications.ts

/**
 * Updates the status of a specific reminder notification.
 */
export async function completeReminderNotificationAction(
   notificationId: string, 
   userId: string, 
   skipped: boolean = false,
   logDetails?: any // Optional log details to store
): Promise<{ success: boolean; error?: string; }> { 
   const newStatus = skipped ? 'skipped' : 'completed';
   logger.info('Completing reminder notification', { notificationId, userId, newStatus, logDetails });

   try {
        const db = await getUserDb();
        await db.reminder_notifications.updateMany({
            where: {
                id: notificationId,
                user_id: userId,
                status: 'pending', // Important: Only update pending notifications
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

   // Revalidate relevant paths. Revalidating the inbox path is key.
   revalidatePath(`/components/patient/TrackingInbox`); 
   revalidatePath(`/patient/dashboard`);

   logger.info("Reminder notification completed successfully", { notificationId, newStatus });
   return { success: true }; 
} 