import { spawn } from 'node:child_process'; // Use built-in spawn
import path from 'path';

// Utility to run a command and pipe its output using spawn
async function runCommand(command: string, args: string[], options?: any): Promise<void> {
  console.log(`
--- Running: ${command} ${args.join(' ')} ---
`);
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

// Simple sleep function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function setupLocalFull() {
  console.log('Starting full local Supabase setup...');
  
  try {
    // 1. Start Supabase
    await runCommand('pnpm', ['sb:local:start']);

    // 2. Wait for services (adjust time if needed)
    console.log('Waiting 10 seconds for services to stabilize...');
    await sleep(10000);

    // 3. Reset DB & Generate Types
    await runCommand('pnpm', ['db:local:reset-types']);

    // 4. Deploy Edge Functions LOCALLY
    await runCommand('npx', ['supabase', 'functions', 'deploy', 'generate-notifications', '--no-verify-jwt', '--local']);

    // 5. Configure local cron job
    await runCommand('pnpm', ['setup:local:cron']);

    // 6. Setup Storage Bucket
    await runCommand('pnpm', ['setup:storage']);

    console.log('\n✅✅✅ Full local setup completed successfully! ✅✅✅\n');

  } catch (error) {
    console.error('\n❌❌❌ Local setup failed! ❌❌❌\n');
    process.exit(1); // Exit with error code
  }
}

setupLocalFull(); 