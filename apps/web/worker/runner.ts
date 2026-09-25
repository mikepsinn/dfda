// worker/runner.ts
import { run } from "graphile-worker";
// No longer need path or url
// import path from 'path';
// import { pathToFileURL } from 'url';

// Import tasks directly
import * as tasks from "./tasks";

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

  // We no longer need taskDirectory logic
  // const resolvedTaskDirPath = path.resolve(__dirname);
  // const taskDirectoryUrl = pathToFileURL(resolvedTaskDirPath).toString();
  // console.log(`[Worker] Resolved task directory path: ${resolvedTaskDirPath}`);
  // console.log(`[Worker] Loading tasks from directory URL: ${taskDirectoryUrl}`);

  console.log(`[Worker] Using explicitly imported task list.`);

  // Run the worker
  const runner = await run({
    connectionString: connectionString,
    concurrency: 5, // Number of jobs to run concurrently
    // noHandleSignals: false, // Recommended to let graphile-worker handle signals
    pollInterval: 1000, // How often to check for jobs (in ms)
    // taskDirectory: taskDirectoryUrl, // REMOVED
    // Provide the task list directly
    taskList: tasks
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