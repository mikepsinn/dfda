import { spawn } from 'node:child_process';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// --- Load Environment Variables ---
// Load from .env.production for remote deployment
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL; // Needed for checks and potentially commands
const bucketName = 'user_uploads'; // Assuming same bucket name

// Utility to run a command and pipe its output using spawn
async function runCommand(command: string, args: string[], options?: any): Promise<void> {
  console.log(`
--- Running: ${command} ${args.join(' ')} ---
`);
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const cmd = isWindows ? `${command}.cmd` : command;
    
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      // Pass current environment variables, which now include .env.production
      env: { ...process.env }, 
      ...options,
    });

    child.on('error', (error) => {
      console.error(`
--- Error spawning command: ${command} ${args.join(' ')} ---`);
      console.error(error.message);
      console.error('--------------------------------------');
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`
--- Completed: ${command} ${args.join(' ')} ---`);
        resolve();
      } else {
        const error = new Error(`Command exited with code ${code}`);
        console.error(`
--- Error running command: ${command} ${args.join(' ')} ---`);
        console.error(error.message);
        console.error('--------------------------------------');
        reject(error);
      }
    });
  });
}

// --- Utility to setup storage bucket ---
async function setupStorageBucket() {
  console.log(`
--- Setting up/Verifying Storage Bucket: ${bucketName} ---
`);
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Remote Supabase URL or Service Role Key not found in environment (.env.production) for storage setup.');
    throw new Error('Missing Supabase credentials for storage setup.');
  }
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  try {
    const { data: existingBucket, error: getError } = await supabaseAdmin.storage.getBucket(bucketName);
    if (existingBucket) {
      console.log(`Bucket "${bucketName}" already exists.`);
      if (existingBucket.public !== false) {
         console.warn(`Bucket "${bucketName}" is public. Updating to private.`);
         const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, { public: false });
         if (updateError) console.error(`Failed to update bucket "${bucketName}" to private:`, updateError.message);
         else console.log(`Bucket "${bucketName}" updated to private.`);
      }
    } else if (getError && getError.message.includes('Bucket not found')) {
      console.log(`Bucket "${bucketName}" not found. Creating...`);
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, { public: false });
      if (createError) throw createError;
      else console.log(`Successfully created private bucket "${bucketName}" with ID: ${newBucket?.name}`);
    } else if (getError) {
      throw getError; // Throw other get errors
    } else {
        throw new Error("Unknown error checking bucket existence.");
    }
     console.log(`
--- Completed: Storage Bucket Setup ---`);
  } catch (error: any) {
    console.error(`
--- Error setting up storage bucket "${bucketName}":`, error.message);
    throw error; // Re-throw to fail the main setup
  }
}

// --- Main Deployment Function ---
async function deployRemote() {
  console.log('🚀 Starting Remote Deployment/Migration...');

  // --- Pre-flight Checks ---
  if (!databaseUrl) {
    console.error('Error: DATABASE_URL not found in environment (.env.production). Cannot run migrations.');
    process.exit(1);
  }
  if (!supabaseUrl || !serviceRoleKey) {
     console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in environment (.env.production). Cannot setup storage.');
     process.exit(1);
  }
   console.log('Using Remote Database URL:', databaseUrl.replace(/:([^:]+)@/, ':********@')); // Mask password
   console.log('Using Remote Supabase URL:', supabaseUrl);

  try {
    // 1. Apply Supabase schema migrations
    // Directly call supabase CLI with the loaded databaseUrl
    if (!databaseUrl) {
      // This check is technically redundant due to pre-flight, but good practice
      throw new Error('DATABASE_URL is not defined after loading .env.production'); 
    }
    await runCommand('npx', ['supabase', 'migration', 'up', '--db-url', databaseUrl]);

    // 2. Run Graphile Worker migrations (reads DATABASE_URL from env)
    // We still need to ensure dotenv loads .env.production for this one,
    await runCommand('pnpm', ['run', 'db:worker:migrate'], {
        env: { 
            ...process.env, 
            DOTENV_CONFIG_PATH: path.resolve(process.cwd(), '.env.production') 
        } // Explicitly point dotenv to production file for this command
    });

    // 3. Setup/Verify Storage Bucket
    await setupStorageBucket();

    // NOTE: Generation steps (types, constants, etc.) are skipped as requested.

    console.log(`
✅✅✅ Remote deployment/migration steps completed successfully! ✅✅✅`);
    console.log('Ensure your application is deployed/restarted to use the updated environment and schema.');

  } catch (error) {
    console.error(`
❌❌❌ Remote deployment/migration failed! ❌❌❌`);
    process.exit(1); // Exit with error code
  }
}

deployRemote(); 