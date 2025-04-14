import { TriggerClient } from "@trigger.dev/sdk";
import { cronTrigger } from "@trigger.dev/sdk";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types"; // Assuming your generated types are here
import { logger } from "@trigger.dev/sdk/v3";
import { Supabase } from "@trigger.dev/supabase"; // Import the Supabase integration

// Ensure client is exported from the API route
import { client } from "@/app/api/trigger/route";

// Check for required environment variables
if (!process.env.SUPABASE_URL) {
  throw new Error("Missing environment variable SUPABASE_URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY");
}

// Create a Supabase JS client instance (can be used inside tasks if needed, but io.supabase is preferred)
const supabaseAdmin = createClient<Database>(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } } // Important for server-side/non-browser usage
);

// Instantiate the Trigger.dev Supabase integration client
const supabaseIntegration = new Supabase({
  id: "supabase-service-role", // Unique ID for this integration instance
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // Use service role key for admin access
});

// Define the scheduled job
client.defineJob({
  id: "generate-reminder-notifications",
  name: "Generate Reminder Notifications",
  version: "1.0.0",
  // Trigger the job every 5 minutes
  trigger: cronTrigger({ cron: "*/5 * * * *" }),
  // Make the Supabase integration available inside the run function
  // integrations: {
  //   supabase: supabaseIntegration,
  // },
  run: async (payload, io, ctx) => {
    const nowUtc = new Date();
    const jobStartTimeIso = nowUtc.toISOString();
    const runIntervalMinutes = 5;
    const lookAheadInterval = `PT${runIntervalMinutes}M`; // ISO 8601 duration format for interval

    await io.logger.info(`🚀 Starting reminder generation run: ${jobStartTimeIso}`);

    // 1. Fetch active reminder schedules using supabaseAdmin client directly
    const { data: schedules, error: scheduleError } = await supabaseAdmin // Use direct client
        .from("reminder_schedules")
        .select("id, user_id, time_of_day, timezone, rrule") // Select necessary fields including rrule
        .eq("is_active", true)
        .is("end_date", null) // Basic filter: no end date
        .lte("start_date", jobStartTimeIso); // Basic filter: started already
        // Note: More sophisticated filtering based on calculated next_trigger_at would be better

    if (scheduleError) {
      await io.logger.error("🚨 Error fetching reminder schedules", { error: scheduleError });
      throw scheduleError; // Fail the job run
    }

    if (!schedules || schedules.length === 0) {
      await io.logger.info("⏹️ No active reminder schedules found. Ending run.");
      return { status: "no_schedules" };
    }

    await io.logger.info(`📋 Found ${schedules.length} active schedules to process.`);

    const notificationsToInsert: Array<Database["public"]["Tables"]["reminder_notifications"]["Insert"]> = [];
    const rrule = await import("rrule"); // Dynamically import rrule

    // 2. Process each schedule
    for (const schedule of schedules) {
      if (!schedule.time_of_day || !schedule.timezone || !schedule.rrule || !schedule.user_id || !schedule.id) {
        await io.logger.warn(`⚠️ Skipping schedule ${schedule.id} due to missing data (time, timezone, rrule, user_id, or id).`);
        continue;
      }

      try {
        // RRULE Parsing Logic (important note on timezones still applies)
        const rule = rrule.rrulestr(schedule.rrule, { dtstart: new Date(nowUtc.getFullYear() -1, 0, 1) });
        const nextOccurrences = rule.between(nowUtc, new Date(nowUtc.getTime() + runIntervalMinutes * 60 * 1000), true);

        if (nextOccurrences.length > 0) {
          const nextOccurrenceLocal = nextOccurrences[0];
          const year = nextOccurrenceLocal.getFullYear();
          const month = nextOccurrenceLocal.getMonth();
          const day = nextOccurrenceLocal.getDate();
          const [hour, minute, second] = schedule.time_of_day.split(':').map(Number);
          const triggerTimeLocalStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
          
          // *** Placeholder for actual UTC calculation ***
          // Requires a robust date/time library (e.g., date-fns-tz, luxon)
          // to correctly convert triggerTimeLocalStr + schedule.timezone to a UTC Date object.
          // Using new Date() directly here will likely use the server's local timezone.
          const notificationTriggerAt = new Date(triggerTimeLocalStr); // NEEDS PROPER TIMEZONE HANDLING

          await io.logger.info(`   RRule Match: Schedule ${schedule.id} User ${schedule.user_id}. Next occurrence: ${nextOccurrenceLocal}. Calculated Trigger UTC (approx): ${notificationTriggerAt.toISOString()}`);

          notificationsToInsert.push({
            reminder_schedule_id: schedule.id,
            user_id: schedule.user_id,
            notification_trigger_at: notificationTriggerAt.toISOString(),
            status: 'pending',
          });
        } else {
           await io.logger.debug(`  No RRule occurrence within the next ${runIntervalMinutes} mins for schedule ${schedule.id}.`);
        }
      } catch (error) {
        await io.logger.error(`🚨 Error processing rrule for schedule ${schedule.id}`, { error, rrule: schedule.rrule });
      }
    }

    if (notificationsToInsert.length === 0) {
      await io.logger.info("⏹️ No notifications to generate in this interval. Ending run.");
      return { status: "no_notifications_generated" };
    }

    await io.logger.info(`⏳ Preparing to insert ${notificationsToInsert.length} potential notifications.`);

    // 3. Insert notifications using supabaseAdmin client directly
    const { data: insertedData, error: insertError } = await supabaseAdmin // Use direct client
        .from("reminder_notifications")
        .insert(notificationsToInsert)
        .select("id");

    if (insertError) {
      if (insertError.code === '23505') { 
        await io.logger.warn("🔶 Some notifications were duplicates and were skipped during insertion.", { count: notificationsToInsert.length });
      } else {
        await io.logger.error("🚨 Error inserting reminder notifications", { error: insertError });
        throw insertError;
      }
    } else {
      await io.logger.info(`✅ Successfully inserted/skipped ${insertedData?.length ?? 0} notifications (out of ${notificationsToInsert.length} potential).`);
    }

    await io.logger.info(`🏁 Reminder generation run finished.`);
    return { status: "success", generated_count: insertedData?.length ?? 0, potential_count: notificationsToInsert.length };
  },
});