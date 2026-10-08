import { Task } from "graphile-worker";
import { adminDb, isUniqueViolation, type Prisma } from "@/lib/db";
import { timeOfDayToString } from "@/lib/time-of-day";
import { RRule, rrulestr } from 'rrule';
import { DateTime } from 'luxon'; // Import Luxon

// Task: Process a single schedule (e.g., after creation)
export const processSingleSchedule: Task = async (payload, helpers) => {
  const { scheduleId } = payload as { scheduleId: string };
  const logger = helpers.logger;
  const nowUtc = DateTime.utc(); // Use Luxon for easier date/time handling

  logger.info(`🚀 [Task] Processing single schedule: ${scheduleId}`);

  // 1. Fetch the specific schedule (without timezone)
  let schedule;
  try {
    schedule = await adminDb.reminder_schedules.findFirst({
      where: { id: scheduleId, is_active: true },
      select: { id: true, user_id: true, time_of_day: true, rrule: true, start_date: true },
    });
  } catch (scheduleError) {
    logger.error(`🚨 [Task] Error fetching schedule ${scheduleId}`, { error: scheduleError });
    throw scheduleError; // Let graphile-worker handle retry/failure
  }

  if (!schedule) {
    logger.warn(`⚠️ [Task] Schedule ${scheduleId} not found or inactive.`);
    return; // Job is done if schedule doesn't exist or isn't active
  }

  // Fetch user's timezone
  let profile: { timezone: string | null } | null = null;
  let profileError: unknown = null;
  try {
    profile = await adminDb.profiles.findUnique({
      where: { id: schedule.user_id },
      select: { timezone: true },
    });
  } catch (error) {
    profileError = error;
  }

  if (!profile?.timezone) {
      logger.error(`🚨 [Task] Could not fetch timezone for user ${schedule.user_id} on schedule ${schedule.id}. Cannot calculate next trigger.`, { error: profileError });
      // Depending on requirements, either throw or just return
      return; // Skip processing if timezone is missing
  }
  const userTimezone = profile.timezone;

  // 2. Process the schedule and generate the *first* notification
  const notificationsToInsert: Prisma.reminder_notificationsCreateManyInput[] = [];
  if (!schedule.time_of_day || !schedule.rrule || !schedule.user_id || !schedule.id || !schedule.start_date) {
    logger.warn(`⚠️ [Task] Skipping schedule ${schedule.id} due to missing data (time, rrule, userId, id, or start_date).`);
    return; // Cannot process without essential data
  }

  try {
    const rule = rrulestr(schedule.rrule) as RRule; 
    const [hour, minute] = timeOfDayToString(schedule.time_of_day).split(':').map(Number);
    
    // Use the userTimezone obtained from the profile
    const startDateInUserTz = DateTime.fromJSDate(schedule.start_date) 
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
        notification_trigger_at: new Date(notificationTriggerAtUtc), 
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
    try {
      const inserted = await adminDb.reminder_notifications.createMany({ data: notificationsToInsert });
      logger.info(`✅ [Task] Successfully inserted ${inserted.count} notification(s) for schedule ${schedule.id}.`);
    } catch (insertError) {
      if (isUniqueViolation(insertError)) { // Handle duplicates gracefully
        logger.warn("🔶 [Task] Notification was a duplicate and skipped during insertion.", { scheduleId: schedule.id });
      } else {
        logger.error("🚨 [Task] Error inserting reminder notification", { scheduleId: schedule.id, error: insertError });
        throw insertError; // Let graphile-worker handle retry/failure
      }
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
    let schedulesWithTimezone;
    try {
        schedulesWithTimezone = await adminDb.reminder_schedules.findMany({
            where: {
                is_active: true,
                end_date: null, // Check if end_date is null
                start_date: { lte: nowUtc.toJSDate() }, // Ensure start_date is in the past
            },
            select: {
                id: true,
                user_id: true,
                time_of_day: true,
                rrule: true,
                profiles: { select: { timezone: true } },
            },
        });
    } catch (scheduleError) {
        logger.error("🚨 [Task] Error fetching reminder schedules with timezones", { error: scheduleError });
        throw scheduleError; // Let graphile-worker handle retry/failure
    }

    if (schedulesWithTimezone.length === 0) {
        logger.info("⏹️ [Task] No active reminder schedules found.");
        return; // Nothing to do
    }

    logger.info(`📋 [Task] Found ${schedulesWithTimezone.length} active schedules to process.`);

    const notificationsToInsert: Prisma.reminder_notificationsCreateManyInput[] = [];

    // 2. Process each schedule
    for (const schedule of schedulesWithTimezone) {
        const userTimezone = schedule.profiles.timezone || 'UTC'; 

        if (!schedule.time_of_day || !schedule.rrule || !schedule.user_id || !schedule.id || !schedule.profiles.timezone) {
             logger.warn(`⚠️ [Task] Skipping schedule ${schedule.id} due to missing data or timezone.`);
            continue;
        }
        
        // Parse the target hour and minute ONCE per schedule
        const timeOfDay = timeOfDayToString(schedule.time_of_day);
        const [targetHour, targetMinute] = timeOfDay.split(':').map(Number);
        if (isNaN(targetHour) || isNaN(targetMinute)) {
            logger.warn(`⚠️ [Task] Skipping schedule ${schedule.id} due to invalid time_of_day format: ${timeOfDay}`);
            continue;
        }

        try {
            const rule = rrulestr(schedule.rrule, { dtstart: nowUtc.minus({ years: 1 }).toJSDate() }) as RRule;
            const windowStart = nowUtc.toJSDate();
            const windowEnd = nowUtc.plus({ minutes: runIntervalMinutes }).toJSDate();
            const nextOccurrencesLocal = rule.between(windowStart, windowEnd, true);
            
            for (const nextOccurrence of nextOccurrencesLocal) {
                // Convert JS Date to Luxon DateTime IN THE USER'S TIMEZONE first
                let occurrenceInUserTz = DateTime.fromJSDate(nextOccurrence).setZone(userTimezone);
                
                // *** FIX: Explicitly set the hour and minute from the schedule ***
                occurrenceInUserTz = occurrenceInUserTz.set({ hour: targetHour, minute: targetMinute, second: 0, millisecond: 0 });

                // Now convert the corrected local time to UTC ISO string for storage
                const triggerAtUtc = occurrenceInUserTz.toUTC().toISO(); 

                if (!triggerAtUtc) {
                   logger.error(`🚨 [Task] Failed to convert calculated occurrence to ISO string for schedule ${schedule.id}`, { occurrenceInUserTz });
                     continue; // Skip this occurrence if conversion fails
                }
                
                notificationsToInsert.push({
                    reminder_schedule_id: schedule.id,
                    user_id: schedule.user_id,
                    notification_trigger_at: new Date(triggerAtUtc),
                    status: 'pending',
                });
                 logger.debug(`   [Task] Queued notification for schedule ${schedule.id}. Trigger At (UTC): ${triggerAtUtc}`);
            }
        } catch (error) {
            logger.error(`🚨 [Task] Error processing rrule for schedule ${schedule.id}`, { error, rrule: schedule.rrule });
            // Continue processing other schedules even if one fails
        }
    }

    // 3. Insert all collected notifications (Batch Insert)
    if (notificationsToInsert.length > 0) {
        logger.info(`⏳ [Task] Inserting ${notificationsToInsert.length} total notifications.`);
        try {
            const inserted = await adminDb.reminder_notifications.createMany({ data: notificationsToInsert });
            logger.info(`✅ [Task] Successfully inserted ${inserted.count} notification(s).`);
        } catch (insertError) {
            if (isUniqueViolation(insertError)) {
                logger.warn("🔶 [Task] Some notifications were duplicates and skipped during batch insertion.");
            } else {
                logger.error("🚨 [Task] Error inserting batch reminder notifications", { error: insertError });
                throw insertError; // Let graphile-worker handle retry/failure
            }
        }
    } else {
        logger.info("⏹️ [Task] No notifications generated in this run.");
    }
    logger.info(`🏁 [Task] Finished generateAllReminders run.`);
};

// --- Add other task definitions here --- 
// export const sendWelcomeEmail: Task = async (payload, helpers) => { ... }; 