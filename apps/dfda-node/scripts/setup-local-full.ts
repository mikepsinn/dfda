import { spawn } from 'node:child_process'; // Use built-in spawn
import path from 'path';

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

// Simple sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupLocalFull() {
  console.log('Starting simplified local Supabase setup...');
  
  try {
    // 1. Start Supabase
    await runCommand('pnpm', ['sb:local:start']);

    // 2. Wait for services (adjust time if needed)
    console.log('Waiting 1 seconds for services to stabilize...');
    await sleep(1000);

    // 3. Reset DB & Generate Types (this applies all migrations, including the new function and cron schedule)
    await runCommand('pnpm', ['db:local:reset-types']);

    // 4. Setup Storage Bucket (if needed)
    await runCommand('pnpm', ['setup:storage']);

    console.log('\n✅✅✅ Simplified local setup completed successfully! ✅✅✅\n');

  } catch (error) {
    console.error('\n❌❌❌ Local setup failed! ❌❌❌\n');
    process.exit(1); // Exit with error code
  }
}

setupLocalFull(); 