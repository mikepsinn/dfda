import { Task } from "graphile-worker";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import { RRule, rrulestr } from 'rrule';
import { DateTime } from 'luxon'; // Import Luxon

// --- Supabase Admin Client Setup (Similar to API route, ensure env vars are available to worker) ---
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_URL for worker");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY for worker");
}

// Create a Supabase client instance for use within tasks
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } } // Important for non-browser environments
);
// --- End Supabase Admin Client Setup ---

// Task: Process a single schedule (e.g., after creation)
export const processSingleSchedule: Task = async (payload, helpers) => {
  const { scheduleId } = payload as { scheduleId: string };
  const logger = helpers.logger;
  const nowUtc = DateTime.utc(); // Use Luxon for easier date/time handling

  logger.info(`🚀 [Task] Processing single schedule: ${scheduleId}`);

  // 1. Fetch the specific schedule (without timezone)
  const { data: schedule, error: scheduleError } = await supabaseAdmin
    .from("reminder_schedules")
    .select("id, user_id, time_of_day, rrule, start_date") // Removed timezone
    .eq("id", scheduleId)
    .eq("is_active", true)
    .maybeSingle();

  if (scheduleError) {
    logger.error(`🚨 [Task] Error fetching schedule ${scheduleId}`, { error: scheduleError });
    throw scheduleError; // Let graphile-worker handle retry/failure
  }

  if (!schedule) {
    logger.warn(`⚠️ [Task] Schedule ${scheduleId} not found or inactive.`);
    return; // Job is done if schedule doesn't exist or isn't active
  }

  // Fetch user's timezone
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('timezone')
    .eq('id', schedule.user_id)
    .single();

  if (profileError || !profile?.timezone) {
      logger.error(`🚨 [Task] Could not fetch timezone for user ${schedule.user_id} on schedule ${schedule.id}. Cannot calculate next trigger.`, { error: profileError });
      // Depending on requirements, either throw or just return
      return; // Skip processing if timezone is missing
  }
  const userTimezone = profile.timezone;

  // 2. Process the schedule and generate the *first* notification
  const notificationsToInsert: Array<Database["public"]["Tables"]["reminder_notifications"]["Insert"]> = [];
  if (!schedule.time_of_day || !schedule.rrule || !schedule.user_id || !schedule.id || !schedule.start_date) {
    logger.warn(`⚠️ [Task] Skipping schedule ${schedule.id} due to missing data (time, rrule, userId, id, or start_date).`);
    return; // Cannot process without essential data
  }

  try {
    const rule = rrulestr(schedule.rrule) as RRule; 
    const [hour, minute] = schedule.time_of_day.split(':').map(Number);
    
    // Use the userTimezone obtained from the profile
    const startDateInUserTz = DateTime.fromISO(schedule.start_date) 
        .setZone(userTimezone, { keepLocalTime: true }) // Use fetched userTimezone
        .set({ hour: hour, minute: minute, second: 0, millisecond: 0 });
    
    const firstOccurrence = rule.after(startDateInUserTz.toJSDate(), true);

    if (firstOccurrence) {
      const notificationTriggerAtUtc = DateTime.fromJSDate(firstOccurrence)
                                               .setZone(userTimezone) // Use fetched userTimezone
                                               .toUTC() 
                                               .toISO(); 

      if (!notificationTriggerAtUtc) {
          logger.error(`🚨 [Task] Failed to convert calculated occurrence to ISO string for schedule ${schedule.id}`, { firstOccurrence });
          throw new Error("Date conversion failed.");
      }

      logger.info(`   [Task] Calculated First Occurrence: Schedule ${schedule.id}. Trigger At (UTC): ${notificationTriggerAtUtc}`);

      notificationsToInsert.push({
        reminder_schedule_id: schedule.id,
        user_id: schedule.user_id,
        notification_trigger_at: notificationTriggerAtUtc, 
        status: 'pending',
      });
    } else {
      logger.warn(`  [Task] No occurrences found at or after the start date for schedule ${schedule.id}. RRule: ${schedule.rrule}, StartDate: ${startDateInUserTz.toISO()}`);
    }
  } catch (error) {
    logger.error(`🚨 [Task] Error processing rrule or calculating first occurrence for schedule ${schedule.id}`, { error, rrule: schedule.rrule });
    throw error; // Let graphile-worker handle retry/failure
  }

  // 3. Insert notifications if generated
  if (notificationsToInsert.length > 0) {
    logger.info(`⏳ [Task] Inserting ${notificationsToInsert.length} notifications for schedule ${schedule.id}.`);
    const { data: insertedData, error: insertError } = await supabaseAdmin
      .from("reminder_notifications")
      .insert(notificationsToInsert)
      .select("id");

    if (insertError) {
      if (insertError.code === '23505') { // Handle duplicates gracefully
        logger.warn("🔶 [Task] Notification was a duplicate and skipped during insertion.", { scheduleId: schedule.id });
      } else {
        logger.error("🚨 [Task] Error inserting reminder notification", { scheduleId: schedule.id, error: insertError });
        throw insertError; // Let graphile-worker handle retry/failure
      }
    } else {
      logger.info(`✅ [Task] Successfully inserted ${insertedData?.length ?? 0} notification(s) for schedule ${schedule.id}.`);
    }
  } else {
      logger.info("⏹️ [Task] No notifications generated for this schedule.");
  }
  logger.info(`🏁 [Task] Finished processing schedule ${scheduleId}.`);
};

// Task: Generate notifications for ALL active schedules (triggered by cron)
export const generateAllReminders: Task = async (payload, helpers) => {
    const logger = helpers.logger;
    const nowUtc = DateTime.utc(); // Use Luxon DateTime
    const jobStartTimeIso = nowUtc.toISO(); // Use ISO format
    const runIntervalMinutes = 5; 

    logger.info(`🚀 [Task] Starting generateAllReminders run: ${jobStartTimeIso}`);

    // 1. Fetch ALL active reminder schedules (without timezone)
    // Also fetch related profile timezone directly using a join
    const { data: schedulesWithTimezone, error: scheduleError } = await supabaseAdmin
        .from("reminder_schedules")
        .select(`
            id,
            user_id,
            time_of_day,
            rrule,
            profiles!inner ( timezone )
        `)
        .eq("is_active", true)
        .filter("end_date", "is", null) // Check if end_date is null
        .lte("start_date", jobStartTimeIso); // Ensure start_date is in the past

    if (scheduleError) {
        logger.error("🚨 [Task] Error fetching reminder schedules with timezones", { error: scheduleError });
        throw scheduleError; // Let graphile-worker handle retry/failure
    }

    if (!schedulesWithTimezone || schedulesWithTimezone.length === 0) {
        logger.info("⏹️ [Task] No active reminder schedules found.");
        return; // Nothing to do
    }

    logger.info(`📋 [Task] Found ${schedulesWithTimezone.length} active schedules to process.`);

    const notificationsToInsert: Array<Database["public"]["Tables"]["reminder_notifications"]["Insert"]> = [];

    // 2. Process each schedule
    for (const schedule of schedulesWithTimezone) {
        // Extract timezone; default to UTC if somehow missing after inner join
        const userTimezone = schedule.profiles?.timezone || 'UTC'; 

        // Removed timezone check
        if (!schedule.time_of_day || !schedule.rrule || !schedule.user_id || !schedule.id) {
            logger.warn(`⚠️ [Task] Skipping schedule ${schedule.id} due to missing data (time, rrule, userId, id).`);
            continue;
        }
        if (!schedule.profiles?.timezone) {
             logger.warn(`⚠️ [Task] Skipping schedule ${schedule.id} due to missing profile timezone after join.`);
            continue;
        }

        try {
            // Use a start date far enough back to catch potentially missed occurrences,
            // but not too far to impact performance.
            // RRule will calculate based on `nowUtc` passed to `between`.
            const rule = rrulestr(schedule.rrule, { dtstart: nowUtc.minus({ years: 1 }).toJSDate() }) as RRule;

            // Calculate the window for checking occurrences
            const windowStart = nowUtc.toJSDate();
            const windowEnd = nowUtc.plus({ minutes: runIntervalMinutes }).toJSDate();

            // Find occurrences within the next interval
            const nextOccurrencesLocal = rule.between(windowStart, windowEnd, true); // `true` includes start time
            
            for (const nextOccurrence of nextOccurrencesLocal) {
                // Convert the JS Date occurrence back to Luxon DateTime
                // Explicitly set the user's timezone, then convert to UTC for storage
                const notificationTriggerAtUtc = DateTime.fromJSDate(nextOccurrence)
                                                        .setZone(userTimezone) // Use fetched userTimezone
                                                        .toUTC()
                                                        .toISO();

                if (!notificationTriggerAtUtc) {
                     logger.error(`🚨 [Task] Failed to convert calculated occurrence to ISO string for schedule ${schedule.id}`, { nextOccurrence });
                     continue; // Skip this occurrence if conversion fails
                }
                
                notificationsToInsert.push({
                    reminder_schedule_id: schedule.id,
                    user_id: schedule.user_id,
                    notification_trigger_at: notificationTriggerAtUtc,
                    status: 'pending',
                });
                 logger.info(`  [Task] Queued notification for schedule ${schedule.id} at ${notificationTriggerAtUtc}`);
            }
        } catch (error) {
            logger.error(`🚨 [Task] Error processing rrule for schedule ${schedule.id}`, { error, rrule: schedule.rrule });
            // Log error but continue processing other schedules
        }
    }

    // 3. Insert all generated notifications
    if (notificationsToInsert.length > 0) {
        logger.info(`⏳ [Task] Inserting ${notificationsToInsert.length} total notifications.`);
        const { data: insertedData, error: insertError } = await supabaseAdmin
            .from("reminder_notifications")
            .insert(notificationsToInsert)
            .select("id");
        if (insertError) {
            if (insertError.code === '23505') {
                logger.warn("🔶 [Task] Some notifications were duplicates and skipped during batch insertion.");
            } else {
                logger.error("🚨 [Task] Error inserting batch reminder notifications", { error: insertError });
                throw insertError; // Let graphile-worker handle retry/failure
            }
        } else {
            logger.info(`✅ [Task] Successfully inserted ${insertedData?.length ?? 0} notification(s).`);
        }
    } else {
        logger.info("⏹️ [Task] No notifications generated in this run.");
    }
    logger.info(`🏁 [Task] Finished generateAllReminders run.`);
};

// --- Add other task definitions here --- 
// export const sendWelcomeEmail: Task = async (payload, helpers) => { ... }; 