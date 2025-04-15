// local-cron.ts
import cron from 'node-cron';
import fetch from 'node-fetch'; // Using node-fetch for compatibility, native fetch also works

const CRON_SCHEDULE = '*/5 * * * *'; // Every 5 minutes
const TARGET_URL = 'http://localhost:3000/api/cron/generate-reminders';
// Optional: Add a secret to secure the endpoint locally
// const CRON_SECRET = process.env.CRON_SECRET || 'your-local-secret';

console.log(`[Local Cron] Initialized. Scheduling requests to ${TARGET_URL} with schedule: ${CRON_SCHEDULE}`);

cron.schedule(CRON_SCHEDULE, async () => {
  const startTime = Date.now();
  console.log(`[Local Cron] [${new Date().toISOString()}] Triggering ${TARGET_URL}...`);

  try {
    const response = await fetch(TARGET_URL, {
      method: 'GET',
      // Optional: Add authorization header if using CRON_SECRET
      // headers: {
      //   'Authorization': `Bearer ${CRON_SECRET}`
      // }
    });

    const duration = Date.now() - startTime;
    const responseBody = await response.json();

    if (response.ok) {
      console.log(`[Local Cron] [${new Date().toISOString()}] Request successful (${response.status}). Duration: ${duration}ms. Result:`, responseBody);
    } else {
      console.error(`[Local Cron] [${new Date().toISOString()}] Request failed (${response.status}). Duration: ${duration}ms. Error:`, responseBody);
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[Local Cron] [${new Date().toISOString()}] Error making fetch request. Duration: ${duration}ms:`, error);
  }
});

// Keep the script running
console.log('[Local Cron] Scheduler is running. Press Ctrl+C to exit.');

// Optional: Handle graceful shutdown if needed
process.on('SIGINT', () => {
  console.log('[Local Cron] Shutting down scheduler...');
  // You might want to destroy the cron job instance if the library supports it
  process.exit(0);
}); 