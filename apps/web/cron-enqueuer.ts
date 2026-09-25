// cron-enqueuer.ts
import cron from 'node-cron';
import { quickAddJob } from 'graphile-worker';

const CRON_SCHEDULE = '*/5 * * * *'; // Every 5 minutes
const TASK_IDENTIFIER = 'generateAllReminders';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("[Cron Enqueuer] DATABASE_URL environment variable is required.");
  process.exit(1);
}

console.log(`[Cron Enqueuer] Initialized. Scheduling task '${TASK_IDENTIFIER}' with schedule: ${CRON_SCHEDULE}`);

cron.schedule(CRON_SCHEDULE, async () => {
  console.log(`[Cron Enqueuer] [${new Date().toISOString()}] Enqueuing job: ${TASK_IDENTIFIER}`);
  try {
    await quickAddJob(
      { connectionString },
      TASK_IDENTIFIER,
      {} // No payload needed for this task
    );
    console.log(`[Cron Enqueuer] [${new Date().toISOString()}] Successfully enqueued job: ${TASK_IDENTIFIER}`);
  } catch (error) {
    console.error(`[Cron Enqueuer] [${new Date().toISOString()}] Error enqueuing job: ${TASK_IDENTIFIER}`, error);
  }
});

// Keep the script running
console.log('[Cron Enqueuer] Scheduler is running. Press Ctrl+C to exit.');
process.on('SIGINT', () => process.exit(0)); 