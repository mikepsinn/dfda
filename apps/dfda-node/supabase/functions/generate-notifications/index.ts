import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { RRule, rrulestr } from "https://esm.sh/rrule@2.7.2"; // Ensure you have the correct esm.sh version if needed
import { DateTime } from "https://esm.sh/luxon@3.3.0"; // Ensure version compatibility
import { toZonedTime, format } from "https://esm.sh/date-fns-tz@2.0.0"; // Ensure version compatibility

console.log("Generate Notifications function starting...");

// Helper to get environment variables
function getEnvVar(key: string): string {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(`Environment variable ${key} is not set.`);
  }
  return value;
}

serve(async (_req) => {
  try {
    const supabaseUrl = getEnvVar("SUPABASE_URL");
    const supabaseServiceKey = getEnvVar("SUPABASE_SERVICE_ROLE_KEY");

    // Create Supabase client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }, // Disable session persistence for server-side
    });

    console.log("Supabase client created.");

    const now = DateTime.utc(); // Use UTC for comparisons
    const nowIso = now.toISO();

    console.log(`Current UTC time: ${nowIso}`);

    // 1. Fetch active schedules that are due
    const { data: schedules, error: fetchError } = await supabaseAdmin
      .from("reminder_schedules")
      .select("id, user_id, rrule, time_of_day, timezone, next_trigger_at, start_date, end_date")
      .eq("is_active", true)
      .lte("next_trigger_at", nowIso) // Fetch schedules whose next trigger is now or in the past
      .not("next_trigger_at", "is", null); // Ensure there is a trigger time

    if (fetchError) {
      console.error("Error fetching schedules:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!schedules || schedules.length === 0) {
      console.log("No due schedules found.");
      return new Response(JSON.stringify({ message: "No due schedules" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${schedules.length} potentially due schedules.`);
    let notificationsCreated = 0;
    let schedulesUpdated = 0;

    // 2. Process each due schedule
    for (const schedule of schedules) {
      console.log(`Processing schedule: ${schedule.id}`);
      try {
        const notificationTime = DateTime.fromISO(schedule.next_trigger_at as string);
        if (!notificationTime.isValid) {
             console.warn(`Invalid next_trigger_at found for schedule ${schedule.id}: ${schedule.next_trigger_at}`);
             continue; // Skip this schedule if date is invalid
        }

        // 3. Insert the notification record (using schedule's next_trigger_at)
        // ON CONFLICT DO NOTHING handles cases where the function might re-run
        // before the schedule's next_trigger_at is updated.
        const { error: insertError } = await supabaseAdmin
          .from("reminder_notifications")
          .insert({
            reminder_schedule_id: schedule.id,
            user_id: schedule.user_id,
            notification_trigger_at: notificationTime.toISO(), // Use the exact trigger time
            status: "pending",
          })
          .select('id') // Select to check if insert happened or conflict occurred
          .single(); 
          // Note: ON CONFLICT requires selecting something to check rows returned.
          // A proper ON CONFLICT target needs the constraint name from the table definition
          // .onConflict('reminder_notifications_schedule_trigger_unique').ignore(); // More robust way

        if (insertError) {
          // Check if it's a unique violation (duplicate - likely harmless due to race condition)
          if (insertError.code === '23505') { // Unique violation
             console.log(`Notification already exists for schedule ${schedule.id} at ${notificationTime.toISO()}, skipping insert.`);
          } else {
            // Log other insertion errors but continue processing other schedules
            console.error(`Error inserting notification for schedule ${schedule.id}:`, insertError);
            continue; 
          }
        } else {
             notificationsCreated++;
             console.log(`Notification created for schedule ${schedule.id} at ${notificationTime.toISO()}`);
        }

        // 4. Calculate the *next* trigger time for the schedule *after* the one just processed
        let newNextTriggerAtIso: string | null = null;
        try {
            const rule = rrulestr(schedule.rrule) as RRule;
            const [hours, minutes] = schedule.time_of_day.split(':').map(Number);
            
            // Use the trigger time just processed as the reference point
            const currentTriggerTime = DateTime.fromISO(schedule.next_trigger_at as string, { zone: schedule.timezone });
            let referenceDate = currentTriggerTime.toJSDate();

            // RRule options
            const options = {
                ...rule.options,
                 // IMPORTANT: RRule works best with JS Dates that are already in the target timezone context
                dtstart: toZonedTime(rule.options.dtstart, schedule.timezone), // Use date-fns-tz for dtstart
                tzid: schedule.timezone,
            };
            const calculationRule = new RRule(options);

            // Find the next occurrence *strictly after* the reference time
            const nextOccurrence = calculationRule.after(referenceDate, false);

            if (nextOccurrence) {
                // Check against schedule end date if it exists
                if (schedule.end_date && DateTime.fromJSDate(nextOccurrence) > DateTime.fromISO(schedule.end_date)) {
                    console.log(`Next occurrence for ${schedule.id} is after schedule end date.`);
                    newNextTriggerAtIso = null; // No more triggers
                } else {
                    // Convert back to ISO string in UTC for storage
                    newNextTriggerAtIso = DateTime.fromJSDate(nextOccurrence, { zone: schedule.timezone }).toISO();
                    console.log(`Calculated NEW next trigger for schedule ${schedule.id}: ${newNextTriggerAtIso}`);
                }
            } else {
                console.log(`No future occurrences found for schedule ${schedule.id} after ${schedule.next_trigger_at}.`);
                newNextTriggerAtIso = null; // Mark schedule as finished for triggering
            }
        } catch (ruleError) {
            console.error(`Error calculating next trigger for schedule ${schedule.id}:`, ruleError);
            // If calculation fails, maybe leave next_trigger_at as is, or set null?
            // Setting null prevents retrying a bad rule indefinitely.
            newNextTriggerAtIso = null; 
            console.warn(`Setting next_trigger_at to NULL for schedule ${schedule.id} due to calculation error.`);
        }

        // 5. Update the schedule with the new next_trigger_at
        const { error: updateError } = await supabaseAdmin
          .from("reminder_schedules")
          .update({ next_trigger_at: newNextTriggerAtIso })
          .eq("id", schedule.id);

        if (updateError) {
          console.error(`Error updating next_trigger_at for schedule ${schedule.id}:`, updateError);
          // Log error but continue processing other schedules
        } else {
           schedulesUpdated++;
           console.log(`Successfully updated next_trigger_at for schedule ${schedule.id} to ${newNextTriggerAtIso}`);
        }

      } catch(scheduleError) {
         console.error(`Failed to process schedule ${schedule.id}:`, scheduleError);
         // Log error for this specific schedule and continue
      }
    } // end for loop

    console.log(`Processing complete. Notifications Created: ${notificationsCreated}, Schedules Updated: ${schedulesUpdated}`);

    return new Response(JSON.stringify({ success: true, notificationsCreated, schedulesUpdated }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    console.error("Fatal error in generate-notifications function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}); 