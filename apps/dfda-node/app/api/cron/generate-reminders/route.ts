import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/lib/database.types";
import { RRule, rrulestr } from 'rrule'; // Import RRule

// --- Supabase Admin Client Setup (Copied from trigger/reminders.ts) ---
// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing environment variable NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY");
}

// Create a Supabase JS client instance (Use Service Role for cron jobs)
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);
// --- End Supabase Admin Client Setup ---

// Simple logger for this route
const logger = {
  info: (...args: any[]) => console.log('[Cron API - Info]', ...args),
  warn: (...args: any[]) => console.warn('[Cron API - Warn]', ...args),
  error: (...args: any[]) => console.error('[Cron API - Error]', ...args),
  debug: (...args: any[]) => console.debug('[Cron API - Debug]', ...args),
};

// This handler will contain the core logic from the old Trigger.dev job
async function generateReminders() {
  const nowUtc = new Date();
  const jobStartTimeIso = nowUtc.toISOString();
  const runIntervalMinutes = 5; // How far ahead to look for occurrences

  await logger.info(`🚀 Starting reminder generation run: ${jobStartTimeIso}`);

  // 1. Fetch ALL active reminder schedules
  const { data: schedules, error: scheduleError } = await supabaseAdmin
    .from("reminder_schedules")
    .select("id, user_id, time_of_day, timezone, rrule")
    .eq("is_active", true)
    .is("end_date", null)
    .lte("start_date", jobStartTimeIso);

  if (scheduleError) {
    await logger.error("🚨 Error fetching reminder schedules", { error: scheduleError });
    throw scheduleError; // Let the caller handle the error
  }

  if (!schedules || schedules.length === 0) {
    await logger.info("⏹️ No active reminder schedules found.");
    return { status: "no_schedules", count: 0 };
  }

  await logger.info(`📋 Found ${schedules.length} active schedules to process.`);

  const notificationsToInsert: Array<Database["public"]["Tables"]["reminder_notifications"]["Insert"]> = [];
  
  // 2. Process each schedule
  for (const schedule of schedules) {
    if (!schedule.time_of_day || !schedule.timezone || !schedule.rrule || !schedule.user_id || !schedule.id) {
      await logger.warn(`⚠️ Skipping schedule ${schedule.id} due to missing data (time, timezone, rrule, user_id, or id).`);
      continue;
    }

    try {
      // Use dynamic import for rrule inside the loop if preferred, or keep top-level import
      // const rrule = await import("rrule"); 
      const rule = rrulestr(schedule.rrule, { dtstart: new Date(nowUtc.getFullYear() - 1, 0, 1) }) as RRule;
      const nextOccurrences = rule.between(nowUtc, new Date(nowUtc.getTime() + runIntervalMinutes * 60 * 1000), true);

      if (nextOccurrences.length > 0) {
        const nextOccurrenceLocal = nextOccurrences[0];
        const year = nextOccurrenceLocal.getFullYear();
        const month = nextOccurrenceLocal.getMonth();
        const day = nextOccurrenceLocal.getDate();
        const [hour, minute, second] = schedule.time_of_day.split(':').map(Number);
        const triggerTimeLocalStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
        
        // IMPORTANT: Timezone handling is still needed here for accuracy
        const notificationTriggerAt = new Date(triggerTimeLocalStr); 

        await logger.info(`   RRule Match: Schedule ${schedule.id} User ${schedule.user_id}. Next occurrence: ${nextOccurrenceLocal}. Calculated Trigger UTC (approx): ${notificationTriggerAt.toISOString()}`);

        notificationsToInsert.push({
          reminder_schedule_id: schedule.id,
          user_id: schedule.user_id,
          notification_trigger_at: notificationTriggerAt.toISOString(),
          status: 'pending',
        });
      } else {
         await logger.debug(`  No RRule occurrence within the next ${runIntervalMinutes} mins for schedule ${schedule.id}.`);
      }
    } catch (error) {
      await logger.error(`🚨 Error processing rrule for schedule ${schedule.id}`, { error, rrule: schedule.rrule });
      // Continue to next schedule on error
    }
  }

  if (notificationsToInsert.length === 0) {
    await logger.info("⏹️ No notifications to generate in this interval.");
    return { status: "no_notifications_generated", count: 0 };
  }

  await logger.info(`⏳ Preparing to insert ${notificationsToInsert.length} potential notifications.`);

  // 3. Insert notifications
  const { data: insertedData, error: insertError } = await supabaseAdmin
    .from("reminder_notifications")
    .insert(notificationsToInsert)
    .select("id");

  let generatedCount = 0;
  if (insertError) {
    if (insertError.code === '23505') { 
      await logger.warn("🔶 Some notifications were duplicates and were skipped during insertion.", { count: notificationsToInsert.length });
      // We don't know how many succeeded vs failed due to duplicate constraint
      // We could try inserting one-by-one or fetching count before/after for accuracy
      generatedCount = -1; // Indicate unknown count due to duplicates
    } else {
      await logger.error("🚨 Error inserting reminder notifications", { error: insertError });
      throw insertError; // Let caller handle unexpected DB errors
    }
  } else {
    generatedCount = insertedData?.length ?? 0;
    await logger.info(`✅ Successfully inserted ${generatedCount} notifications.`);
  }

  await logger.info(`🏁 Reminder generation run finished.`);
  return { status: "success", count: generatedCount };
}

// Handler for the GET request from the cron job
export async function GET(request: NextRequest) {
  // Optional: Add security check (e.g., check a secret header or query param)
  // if (request.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // }

  try {
    const result = await generateReminders();
    return NextResponse.json({ message: "Reminder generation process finished.", ...result });
  } catch (error) {
    logger.error('Cron job failed:', error);
    return NextResponse.json({ error: 'Failed to generate reminders', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// Recommended: Ensure the route is dynamic
export const dynamic = "force-dynamic"; 