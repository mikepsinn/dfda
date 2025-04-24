import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
// Remove ES Module specific imports and helpers
// import { fileURLToPath } from 'url';

// Helper to get __dirname in ES modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Load environment variables from .env file at the project root
// Assumes the .env file is two levels up from the scripts/ directory
try {
    // Use the standard CommonJS __dirname directly
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    console.log("Loaded environment variables from .env file.");
} catch (e) {
    console.warn("Could not load .env file. Relying on system environment variables.", e);
}


const projectId = process.env.SUPABASE_PROJECT_ID;
// Use SUPABASE_PASSWORD, which the CLI typically checks for the database password
const dbPassword = process.env.SUPABASE_PASSWORD;

if (!projectId) {
  console.error(
    '❌ Error: SUPABASE_PROJECT_ID environment variable is not set.',
    'Please define it in your .env file or system environment.',
  );
  process.exit(1);
}

// For this method, the password is required
if (!dbPassword) {
  console.error(
    '❌ Error: SUPABASE_PASSWORD environment variable must be set in .env for non-interactive linking.'
  );
  process.exit(1);
}

console.log(`\n🔗 Attempting to link Supabase project: ${projectId} non-interactively...`);

const command = 'npx';
const args = ['supabase', 'link', '--project-ref', projectId];

console.log(`Executing: ${command} ${args.join(' ')}`);

// Use spawn for better stdio control
const child = spawn(command, args, {
  env: process.env, // Pass environment variables
  stdio: ['pipe', 'inherit', 'inherit'], // stdin: pipe, stdout/stderr: inherit
});

// Write the password to the command's stdin when it prompts
// Adding a newline character simulates pressing Enter after typing the password.
child.stdin.write(dbPassword + '\n');
child.stdin.end(); // Close stdin to signal we're done providing input

child.on('error', (error) => {
  console.error(`\n❌ Error spawning Supabase link command: ${error.message}`);
  process.exit(1);
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Supabase project linked successfully!');
  } else {
    console.error(`\n❌ Supabase link command failed with exit code: ${code}`);
  }
  process.exit(code ?? 1); // Exit with the command's code or 1 on failure
}); 