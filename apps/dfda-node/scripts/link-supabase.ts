import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';

// Helper: Extract project ref from SUPABASE_URL
function getProjectIdFromUrl(url?: string): string | undefined {
  if (!url) return undefined;
  // e.g. https://ylshevuuilsayhxggkzl.supabase.co
  const match = url.match(/https?:\/\/(.*?)\.supabase\.co/);
  return match ? match[1] : undefined;
}

// Helper: Extract password from POSTGRES_URL
function getPasswordFromPostgresUrl(pgUrl?: string): string | undefined {
  if (!pgUrl) return undefined;
  // e.g. postgres://postgres.ylshevuuilsayhxggkzl:LJ2KSnTAUEDR68lo@aws-0-us-east-1.pooler.supabase.com:6543/postgres
  const match = pgUrl.match(/^postgres:\/\/.*?:(.*?)@/);
  return match ? match[1] : undefined;
}

// Load environment variables from .env file at the project root
try {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
    console.log("Loaded environment variables from .env file.");
} catch (e) {
    console.warn("Could not load .env file. Relying on system environment variables.", e);
}

// Try to get projectId from SUPABASE_PROJECT_ID or from SUPABASE_URL
let projectId = process.env.SUPABASE_PROJECT_ID || getProjectIdFromUrl(process.env.SUPABASE_URL);
if (!projectId) {
  console.error(
    '❌ Error: Could not determine SUPABASE_PROJECT_ID. Set SUPABASE_PROJECT_ID or SUPABASE_URL in your .env.'
  );
  process.exit(1);
}

// Try to get dbPassword from SUPABASE_PASSWORD or from POSTGRES_URL
let dbPassword = process.env.SUPABASE_PASSWORD || getPasswordFromPostgresUrl(process.env.POSTGRES_URL);
if (!dbPassword) {
  console.error(
    '❌ Error: Could not determine SUPABASE_PASSWORD. Set SUPABASE_PASSWORD or POSTGRES_URL in your .env.'
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