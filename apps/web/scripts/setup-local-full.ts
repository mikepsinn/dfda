import { spawn } from 'node:child_process'; // Use built-in spawn
import path from 'path';
import dotenv from 'dotenv'; // Add dotenv import
import { ensureBucket } from '../lib/storage';

// --- Load Environment Variables ---
// Load from .env for script execution
dotenv.config({ path: path.resolve(process.cwd(), '.env') });


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

    // 6. Update the Prisma schema and client from the database
    await runCommand('pnpm', ['db:pull']);

    // 7. Generate Constants from DB
    await runCommand('pnpm', ['run', 'generate:constants']);

    // 8. Generate Navigation from files
    await runCommand('pnpm', ['run', 'generate:nav']);

    console.log('\n✅✅✅ Full local setup completed successfully! ✅✅✅');
    console.log('You can now run \'pnpm run dev\' to start the application.');

  } catch (error) {
    console.error('\n❌❌❌ Full local setup failed! ❌❌❌');
    process.exit(1); // Exit with error code
  }
}

setupLocalFull(); 