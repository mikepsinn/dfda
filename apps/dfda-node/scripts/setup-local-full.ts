import { spawn } from 'node:child_process'; // Use built-in spawn
import path from 'path';
import { createClient } from '@supabase/supabase-js'; // Add Supabase client import
import dotenv from 'dotenv'; // Add dotenv import

// --- Load Environment Variables ---
// Load from .env for script execution
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = 'user_uploads'; // Define bucket name

// Utility to run a command and pipe its output using spawn
async function runCommand(command: string, args: string[], options?: any): Promise<void> {
  console.log(`\n--- Running: ${command} ${args.join(' ')} ---\n`);
  return new Promise((resolve, reject) => {
    // Determine the actual command/executable for cross-platform compatibility
    // npm/pnpm/npx often need '.cmd' on Windows
    const isWindows = process.platform === "win32";
    const cmd = isWindows ? `${command}.cmd` : command;
    
    const child = spawn(cmd, args, {
      stdio: 'inherit', // Pipe output to current console
      shell: true, // Often needed for commands like npx/pnpm
      cwd: process.cwd(), // Run in the current working directory
      ...options,
    });

    child.on('error', (error) => {
      console.error(`\n--- Error spawning command: ${command} ${args.join(' ')} ---`);
      console.error(error.message);
      console.error('--------------------------------------');
      reject(error); // Reject the promise on spawn error
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`\n--- Completed: ${command} ${args.join(' ')} ---`);
        resolve(); // Resolve the promise on successful exit
      } else {
        const error = new Error(`Command exited with code ${code}`);
        console.error(`\n--- Error running command: ${command} ${args.join(' ')} ---`);
        console.error(error.message);
        console.error('--------------------------------------');
        reject(error); // Reject the promise on non-zero exit code
      }
    });
  });
}

// --- Utility to setup storage bucket ---
async function setupStorageBucket() {
  console.log(`\n--- Setting up Storage Bucket: ${bucketName} ---\n`);
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Supabase URL or Service Role Key not found in .env for storage setup.');
    throw new Error('Missing Supabase credentials for storage setup.');
  }
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  try {
    const { data: existingBucket, error: getError } = await supabaseAdmin.storage.getBucket(bucketName);
    if (existingBucket) {
      console.log(`Bucket \"${bucketName}\" already exists.`);
      if (existingBucket.public !== false) {
         console.warn(`Bucket \"${bucketName}\" is public. Updating to private.`);
         const { error: updateError } = await supabaseAdmin.storage.updateBucket(bucketName, { public: false });
         if (updateError) console.error(`Failed to update bucket \"${bucketName}\" to private:`, updateError.message);
         else console.log(`Bucket \"${bucketName}\" updated to private.`);
      }
    } else if (getError && getError.message.includes('Bucket not found')) {
      console.log(`Bucket \"${bucketName}\" not found. Creating...`);
      const { data: newBucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, { public: false });
      if (createError) throw createError;
      else console.log(`Successfully created private bucket \"${bucketName}\" with ID: ${newBucket?.name}`);
    } else if (getError) {
      throw getError; // Throw other get errors
    } else {
        throw new Error("Unknown error checking bucket existence.");
    }
     console.log(`\n--- Completed: Storage Bucket Setup ---`);
  } catch (error: any) {
    console.error(`\n--- Error setting up storage bucket \"${bucketName}\":`, error.message);
    throw error; // Re-throw to fail the main setup
  }
}

// Simple sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// --- Main Setup Function ---
async function setupLocalFull() {
  console.log('🚀 Starting Full Local Development Setup...');
  
  try {
    // 1. Start Supabase services
    await runCommand('pnpm', ['sb:local:start']);

    // 2. Wait briefly for services
    console.log('Waiting 2 seconds for services to initialize...');
    await sleep(2000); 

    // 3. Reset Supabase DB (applies *only* Supabase migrations)
    await runCommand('pnpm', ['db:local:reset']);

    // 4. Run Graphile Worker migrations (creates graphile_worker schema *after* reset)
    await runCommand('pnpm', ['run', 'db:worker:migrate']);

    // 5. Setup Storage Bucket
    await setupStorageBucket();

    // 6. Generate Types
    await runCommand('pnpm', ['db:local:types']);

    // 7. Generate Constants from DB
    await runCommand('pnpm', ['run', 'generate:constants']);

    // 8. Generate Zod Schemas from DB types
    await runCommand('pnpm', ['run', 'generate:schemas']);

    console.log('\n✅✅✅ Full local setup completed successfully! ✅✅✅');
    console.log('You can now run \'pnpm run dev\' to start the application.');

  } catch (error) {
    console.error('\n❌❌❌ Full local setup failed! ❌❌❌');
    process.exit(1); // Exit with error code
  }
}

setupLocalFull(); 