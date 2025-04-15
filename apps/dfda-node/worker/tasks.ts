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

  // 1. Fetch the specific schedule
  const { data: schedule, error: scheduleError } = await supabaseAdmin
    .from("reminder_schedules")
    // Also fetch start_date to accurately calculate the first occurrence
    .select("id, user_id, time_of_day, timezone, rrule, start_date") 
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

  // 2. Process the schedule and generate the *first* notification
  const notificationsToInsert: Array<Database["public"]["Tables"]["reminder_notifications"]["Insert"]> = [];
  if (!schedule.time_of_day || !schedule.timezone || !schedule.rrule || !schedule.user_id || !schedule.id || !schedule.start_date) {
    logger.warn(`⚠️ [Task] Skipping schedule ${schedule.id} due to missing data (time, timezone, rrule, userId, id, or start_date).`);
    return; // Cannot process without essential data
  }

  try {
    // Parse RRULE string - Ensure dtstart is handled correctly by rrule library
    const rule = rrulestr(schedule.rrule) as RRule; 
    const [hour, minute] = schedule.time_of_day.split(':').map(Number);
    
    // Use the schedule's start_date as the basis for the first occurrence calculation
    // Set the time according to the schedule's time_of_day in the user's timezone
    const startDateInUserTz = DateTime.fromISO(schedule.start_date) // Assume start_date is stored as ISO date string 'YYYY-MM-DD' or similar
        .setZone(schedule.timezone, { keepLocalTime: true }) // Interpret the date part in the user's timezone
        .set({ hour: hour, minute: minute, second: 0, millisecond: 0 });
    
    // Use the rule to find the *first* occurrence at or after the constructed start time
    const firstOccurrence = rule.after(startDateInUserTz.toJSDate(), true);

    if (firstOccurrence) {
      // Convert the JS Date occurrence (which rrule treats as local) back to a Luxon DateTime 
      // and explicitly set the timezone before converting to UTC for storage.
      const notificationTriggerAtUtc = DateTime.fromJSDate(firstOccurrence)
                                               .setZone(schedule.timezone) // Tell Luxon this time is IN the user's timezone
                                               .toUTC() // Convert to UTC
                                               .toISO(); // Get ISO string

      if (!notificationTriggerAtUtc) {
          logger.error(`🚨 [Task] Failed to convert calculated occurrence to ISO string for schedule ${schedule.id}`, { firstOccurrence });
          throw new Error("Date conversion failed.");
      }

      logger.info(`   [Task] Calculated First Occurrence: Schedule ${schedule.id}. Trigger At (UTC): ${notificationTriggerAtUtc}`);

      notificationsToInsert.push({
        reminder_schedule_id: schedule.id,
        user_id: schedule.user_id,
        notification_trigger_at: notificationTriggerAtUtc, // Store UTC ISO string
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
    const nowUtc = new Date();
    const jobStartTimeIso = nowUtc.toISOString();
    const runIntervalMinutes = 5; 

    logger.info(`🚀 [Task] Starting generateAllReminders run: ${jobStartTimeIso}`);

    // 1. Fetch ALL active reminder schedules
    const { data: schedules, error: scheduleError } = await supabaseAdmin
        .from("reminder_schedules")
        .select("id, user_id, time_of_day, timezone, rrule")
        .eq("is_active", true)
        .is("end_date", null)
        .lte("start_date", jobStartTimeIso);

    if (scheduleError) {
        logger.error("🚨 [Task] Error fetching reminder schedules", { error: scheduleError });
        throw scheduleError; // Let graphile-worker handle retry/failure
    }

    if (!schedules || schedules.length === 0) {
        logger.info("⏹️ [Task] No active reminder schedules found.");
        return; // Nothing to do
    }

    logger.info(`📋 [Task] Found ${schedules.length} active schedules to process.`);

    const notificationsToInsert: Array<Database["public"]["Tables"]["reminder_notifications"]["Insert"]> = [];

    // 2. Process each schedule (same logic as the API route/single task)
    for (const schedule of schedules) {
        if (!schedule.time_of_day || !schedule.timezone || !schedule.rrule || !schedule.user_id || !schedule.id) {
            logger.warn(`⚠️ [Task] Skipping schedule ${schedule.id} due to missing data.`);
            continue;
        }
        try {
            const rule = rrulestr(schedule.rrule, { dtstart: new Date(nowUtc.getFullYear() - 1, 0, 1) }) as RRule;
            const nextOccurrences = rule.between(nowUtc, new Date(nowUtc.getTime() + runIntervalMinutes * 60 * 1000), true);
            if (nextOccurrences.length > 0) {
                const nextOccurrenceLocal = nextOccurrences[0];
                const year = nextOccurrenceLocal.getFullYear();
                const month = nextOccurrenceLocal.getMonth();
                const day = nextOccurrenceLocal.getDate();
                const [hour, minute, second] = schedule.time_of_day.split(':').map(Number);
                const triggerTimeLocalStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
                const notificationTriggerAt = new Date(triggerTimeLocalStr); // NEEDS TIMEZONE HANDLING
                notificationsToInsert.push({
                    reminder_schedule_id: schedule.id,
                    user_id: schedule.user_id,
                    notification_trigger_at: notificationTriggerAt.toISOString(),
                    status: 'pending',
                });
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