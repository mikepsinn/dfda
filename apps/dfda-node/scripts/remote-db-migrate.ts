import path from 'path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { BUCKET_NAME } from '../lib/constants/storage'; // Add import
import { spawn } from 'node:child_process'; // Add spawn import
import fs from 'fs/promises'; // Add fs promises
// import { Client as PgClient } from 'pg'; // REMOVED: No longer needed here
// import { randomUUID } from 'node:crypto'; // REMOVED: No longer needed here
// import { URL } from 'url'; // REMOVED: No longer needed for parsing DB URL for username

// --- Load Environment Variables ---
// Load from .env file in the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL; // Use DATABASE_URL for migrations/seeding
const migrationsDir = 'supabase/migrations'; // Define migrations directory
// const seedDir = 'supabase/seeds'; // REMOVED: Define seed directory path
// const bucketName = 'user_uploads'; // Define the target bucket name - Replaced below

// --- Utility to run a command and pipe its output using spawn ---
// Copied from setup-local-full.ts
async function runCommand(command: string, args: string[], options?: any): Promise<void> {
  console.log(`
--- Running: ${command} ${args.join(' ')} ---
`);
  return new Promise((resolve, reject) => {
    // Determine the actual command/executable for cross-platform compatibility
    const isWindows = process.platform === "win32";
    // Use npx to ensure we run the locally installed version
    const baseCommand = isWindows ? 'npx.cmd' : 'npx';
    const fullArgs = [command, ...args]; // Prepend the actual command for npx

    const child = spawn(baseCommand, fullArgs, {
      stdio: 'inherit', // Pipe output to current console
      shell: true, // Often needed for commands like npx/pnpm/supabase
      cwd: process.cwd(), // Run in the current working directory
      ...options, // Allow overriding options like env
    });

     child.on('error', (error) => {
      console.error(`
--- Error spawning command: ${command} ${args.join(' ')} ---`);
      console.error(error.message);
      console.error('--------------------------------------');
      reject(error); // Reject the promise on spawn error
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`
--- Completed: ${command} ${args.join(' ')} ---`);
        resolve(); // Resolve the promise on successful exit
      } else {
        const error = new Error(`Command exited with code ${code}`);
        console.error(`
--- Error running command: ${command} ${args.join(' ')} ---`);
        console.error(error.message);
        console.error('--------------------------------------');
        reject(error); // Reject the promise on non-zero exit code
      }
    });
  });
}

// --- Utility to setup storage bucket ---
async function setupStorageBucket() {
  const bucketName = BUCKET_NAME; // Use imported constant
  console.log(`
--- Setting up Remote Storage Bucket: ${bucketName} ---`);
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
    console.error('These are required to connect to the remote Supabase instance.');
    throw new Error('Missing Supabase credentials for remote storage setup.');
  }

  console.log(`Connecting to Supabase at: ${supabaseUrl}`);
  const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  try {
    // Check if bucket exists
    const { data: existingBucket, error: getError } = await supabaseAdmin.storage.getBucket(bucketName);

    if (existingBucket) {
      console.log(`Bucket "${bucketName}" already exists.`);
      // Ensure the bucket is private (as per original script logic)
      if (existingBucket.public !== false) {
         console.warn(`Bucket "${bucketName}" is public. Updating to private.`);
         const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, { public: false });
         if (updateError) {
            console.error(`Failed to update bucket "${bucketName}" to private:`, updateError.message);
            throw updateError; // Throw if update fails
         } else {
            console.log(`Bucket "${bucketName}" updated to private.`);
         }
      } else {
        console.log(`Bucket "${bucketName}" is already private.`);
      }
    } else if (getError && getError.message.includes('Bucket not found')) {
      // Bucket doesn't exist, create it
      console.log(`Bucket "${bucketName}" not found. Creating...`);
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, { public: false });
      if (createError) {
        console.error(`Failed to create bucket "${bucketName}":`, createError.message);
        throw createError;
      } else {
        console.log(`Successfully created private bucket "${bucketName}" with ID: ${newBucket?.name}`);
      }
    } else if (getError) {
      // Handle other errors during bucket check
      console.error(`Error checking bucket "${bucketName}":`, getError.message);
      throw getError;
    } else {
        // Unexpected scenario
        throw new Error(`Unknown error checking bucket existence for "${bucketName}".`);
    }

     console.log(`
--- Completed: Remote Storage Bucket Setup for "${bucketName}" ---`);
  } catch (error: any) {
    console.error(`
--- Error setting up remote storage bucket "${bucketName}":`, error.message || error);
    throw error; // Re-throw to fail the main setup
  }
}

// --- Utility to Apply Migrations using node-pg-migrate ---
async function applyRemoteMigrations() {
  console.log(`
--- Applying Remote Database Migrations from ${migrationsDir} ---`);

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable not set.');
    console.error('This is required to connect to the remote database for migrations.');
    throw new Error('Missing DATABASE_URL for migrations.');
  }

  try {
    // Check if migrations directory exists
    await fs.access(path.resolve(process.cwd(), migrationsDir));

    // Run node-pg-migrate 'up' command
    // Pass the DB URL via environment variable and migrations dir via command line arg
    await runCommand('node-pg-migrate', ['up', '-m', migrationsDir], {
       env: {
        ...process.env, // Inherit existing env vars
        DATABASE_URL: databaseUrl, // Set the database URL for node-pg-migrate
       },
    });

    console.log(`
--- Completed: Remote Database Migrations ---`);

  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.warn(`
--- Warning: Migrations directory "${migrationsDir}" not found. Skipping migrations. ---`);
    } else {
      console.error(`
--- Error applying remote database migrations:`, error.message || error);
      throw error; // Re-throw to fail the main setup
    }
  }
}

// --- Utility to Apply Worker Migrations ---
async function applyWorkerMigrations() {
  console.log(`
--- Applying Graphile Worker Migrations ---`);

  if (!databaseUrl) {
    console.error('Error: DATABASE_URL environment variable not set.');
    console.error('This is required to connect to the remote database for worker migrations.');
    throw new Error('Missing DATABASE_URL for worker migrations.');
  }

  try {
    // Run the worker migration command (assuming it's defined in package.json)
    // Pass DATABASE_URL via environment variables
    await runCommand('pnpm', ['run', 'db:worker:migrate'], {
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl, // Ensure worker migration script uses the correct DB
      },
    });

    console.log(`
--- Completed: Graphile Worker Migrations ---`);
  } catch (error: any) {
    console.error(`
--- Error applying Graphile worker migrations:`, error.message || error);
    throw error; // Re-throw to fail the main setup
  }
}

// --- Main Setup Function ---
async function setupRemoteInstance() {
  console.log('🚀 Starting Remote Supabase Instance Setup...');

  try {
    // 1. Setup Storage Bucket
    await setupStorageBucket();

    // 2. Apply Database Migrations (Extensions created via migration, search_path handled within migration files if needed)
    await applyRemoteMigrations();

    // 3. Apply Worker Migrations
    await applyWorkerMigrations();

    // REMOVED: Seeding is now handled by scripts/remote-db-seed.ts
    // await applyRemoteSeed();

    // REMOVED: Profile creation trigger check moved to scripts/test-profile-trigger.ts
    // await checkProfileCreationTrigger();

    // Add other remote setup tasks here if needed in the future
    // (e.g., deploying functions if applicable to your setup)

    // Final success message
    console.log(`
Remote instance setup tasks completed successfully!
Project: ${process.env.SUPABASE_PROJECT_ID} // This might be irrelevant for self-hosted
`);

  } catch (error) {
    // Log error and exit
    console.error(`
Remote instance setup failed!
Error: ${error instanceof Error ? error.message : String(error)}
`);
    process.exit(1); // Exit with error code
  }
}

// --- Run the setup ---
setupRemoteInstance(); 