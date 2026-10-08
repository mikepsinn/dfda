import { spawn } from 'node:child_process';
import path from 'path';
import dotenv from 'dotenv';
import { ensureBucket } from '../lib/storage';

// --- Load Environment Variables ---
// Load from .env.production for remote deployment
dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const databaseUrl = process.env.DATABASE_URL; // Needed for checks and potentially commands

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
  const bucketName = process.env.S3_BUCKET;
  console.log(`\n--- Setting up storage bucket: ${bucketName} ---\n`);
  try {
    await ensureBucket();
    console.log(`\n--- Completed: storage bucket setup ---`);
  } catch (error: any) {
    console.error(`\n--- Error setting up storage bucket "${bucketName}":`, error.message || error);
    throw error;
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
  if (!process.env.S3_BUCKET) {
     console.error('Error: S3_BUCKET not found in environment (.env.production). Cannot set up storage.');
     process.exit(1);
  }
   console.log('Using Remote Database URL:', databaseUrl.replace(/:([^:]+)@/, ':********@')); // Mask password

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