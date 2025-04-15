// worker/runner.ts
import { run } from "graphile-worker";
import path from 'path';

// Ensure DATABASE_URL is set for graphile-worker
// Typically this should be your Supabase connection string
// It's often good practice to use a specific DB user for the worker
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL environment variable is required for graphile-worker");
  process.exit(1);
}

async function main() {
  console.log('[Worker] Starting graphile-worker...');

  // Define the path to your tasks file
  const taskDirectory = path.resolve(__dirname, 'tasks.ts');
  console.log(`[Worker] Loading tasks from: ${taskDirectory}`);

  // Run the worker
  const runner = await run({
    connectionString: connectionString,
    concurrency: 5, // Number of jobs to run concurrently
    // noHandleSignals: false, // Recommended to let graphile-worker handle signals
    pollInterval: 1000, // How often to check for jobs (in ms)
    taskDirectory: taskDirectory,
    // You might want to add a logger instance here if needed
  });

  console.log('[Worker] Runner started. Waiting for jobs...');

  // Keep the worker running until stopped
  await runner.promise;

  // This will be reached if the worker is stopped gracefully
  console.log('[Worker] Runner stopped.');
}

main().catch((err) => {
  console.error("[Worker] Error running worker: ", err);
  process.exit(1);
}); 