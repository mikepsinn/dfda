import path from 'path';
import dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import { URL } from 'url'; // Import URL for parsing
// Import pg Client to query for policies
import { Client } from 'pg';

// --- Load Environment Variables ---
//dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const databaseUrl = process.env.DATABASE_URL; // Needed for psql

// --- Utility to run a general command (npx, tsx, etc.) ---
async function runCommand(command: string, args: string[], options?: any): Promise<void> {
  console.log(`
--- Running: ${command} ${args.join(' ')} ---`);
  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const effectiveCommand = command === 'tsx' 
        ? (isWindows ? 'tsx.cmd' : 'tsx') 
        : (isWindows ? 'npx.cmd' : 'npx');
    const fullArgs = command === 'tsx' ? args : [command, ...args];

    const child = spawn(effectiveCommand, fullArgs, {
      stdio: 'inherit',
      shell: true,
      cwd: process.cwd(),
      env: { ...process.env }, // Pass environment variables
      ...options,
    });

    child.on('error', (error) => {
      console.error(`
--- Error spawning command: ${effectiveCommand} ${fullArgs.join(' ')} ---`);
      console.error(error.message);
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`
--- Completed: ${effectiveCommand} ${fullArgs.join(' ')} ---`);
        resolve();
      } else {
        const error = new Error(`Command ${effectiveCommand} ${fullArgs.join(' ')} exited with code ${code}`);
        console.error(`
--- Error running command: ${effectiveCommand} ${fullArgs.join(' ')} ---`);
        console.error(error.message);
        reject(error);
      }
    });
  });
}

// --- Utility to run a psql command ---
async function runPsqlCommand(sqlCommand: string): Promise<void> {
  console.log(`
--- Running PSQL Command: "${sqlCommand}" ---`);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable not set. Required for psql connection.');
  }

  let password = '';
  let user = '';
  let host = '';
  let port = '';
  let dbname = '';

  try {
    const parsedUrl = new URL(databaseUrl);
    password = parsedUrl.password;
    user = parsedUrl.username;
    host = parsedUrl.hostname;
    port = parsedUrl.port;
    // Database name is the pathname without the leading slash
    dbname = parsedUrl.pathname ? parsedUrl.pathname.substring(1) : 'postgres'; 

    if (!password) {
      console.warn('Warning: No password found in DATABASE_URL. psql might still prompt if required by server.');
    }
    if (!host || !port || !user || !dbname) {
       throw new Error('DATABASE_URL is missing required components (host, port, user, database).');
    }
  } catch (e) {
    throw new Error(`Failed to parse DATABASE_URL: ${e instanceof Error ? e.message : String(e)}`);
  }

  console.log(`  [Debug] Connecting to: ${user}@${host}:${port}/${dbname}`);
  console.log(`  [Debug] Password length: ${password.length}`); 
  console.log(`  [Debug] Setting PGPASSWORD and using command-line args for psql...`);

  return new Promise((resolve, reject) => {
    const isWindows = process.platform === "win32";
    const psqlExecutable = isWindows ? 'psql.exe' : 'psql'; 

    // Construct command-line arguments
    const psqlArgs = [
        '-h', host,
        '-p', port,
        '-U', user,
        '-d', dbname,
        '-c', sqlCommand
    ];

    console.log(`  [Debug] Executing: ${psqlExecutable} ${psqlArgs.map(a => a.includes(' ') ? `"${a}"`: a).join(' ')}`); // Log the command nicely

    const child = spawn(psqlExecutable, psqlArgs, { // Use explicit args
      stdio: 'inherit',
      shell: false,
      cwd: process.cwd(),
      env: { 
        ...process.env, 
        PGPASSWORD: password, // Still set PGPASSWORD env var
        // Unset other potentially conflicting PG vars from the environment we pass
        PGHOST: undefined,
        PGPORT: undefined,
        PGUSER: undefined,
        PGDATABASE: undefined,
        DATABASE_URL: undefined, // Don't pass DATABASE_URL env var to psql anymore
      },
    });

    child.on('error', (error) => {
      console.error(`
--- Error spawning command: ${psqlExecutable} ---`);
      console.error(`Is 'psql' installed and in your system's PATH?`);
      console.error(error.message);
      reject(error);
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(`
--- Completed PSQL Command: "${sqlCommand}" ---`);
        resolve();
      } else {
        const error = new Error(`Command ${psqlExecutable} exited with code ${code}`);
        console.error(`
--- Error running PSQL Command: "${sqlCommand}" ---`);
        reject(error);
      }
    });
  });
}

// --- Utility to drop policies on specific tables ---
async function dropExistingPolicies() {
  console.log(`
--- Dropping existing policies on specific tables ---`);
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable not set. Required for policy cleanup.');
  }

  // List of schemas and tables where we expect custom policies from migrations
  const tablesToClean: { schema: string; table: string }[] = [
    { schema: 'storage', table: 'objects' },
    { schema: 'public', table: 'uploaded_files' },
    { schema: 'public', table: 'form_answers' },
    { schema: 'public', table: 'form_submissions' },
    { schema: 'public', table: 'form_questions' },
    { schema: 'public', table: 'forms' },
    { schema: 'public', table: 'trial_enrollments' },
    { schema: 'public', table: 'protocol_versions' },
    { schema: 'public', table: 'action_types' },
    { schema: 'public', table: 'trial_actions' },
    { schema: 'public', table: 'data_submissions' },
    { schema: 'public', table: 'trials' },
    { schema: 'public', table: 'patients' },
    { schema: 'public', table: 'profiles' },
    { schema: 'public', table: 'global_variable_relationships' },
    { schema: 'public', table: 'citations' },
    { schema: 'public', table: 'user_variable_images' },
    { schema: 'public', table: 'product_listings' },
    { schema: 'public', table: 'product_sellers' },
    { schema: 'public', table: 'products' },
    { schema: 'public', table: 'variable_ingredients' },
    { schema: 'public', table: 'global_foods' },
    { schema: 'public', table: 'prescriptions' },
    { schema: 'public', table: 'treatment_ratings' },
    { schema: 'public', table: 'patient_side_effects' },
    { schema: 'public', table: 'patient_treatments' },
    { schema: 'public', table: 'research_partners' },
    { schema: 'public', table: 'providers' },
    { schema: 'public', table: 'reminder_schedules' },
    { schema: 'public', table: 'global_variable_synonyms' },
    { schema: 'public', table: 'regulatory_approvals' },
    { schema: 'public', table: 'reminder_notifications' },
    // Add more {schema, table} pairs if other migrations create policies
  ];

  const client = new Client({ connectionString: databaseUrl });
  try {
    await client.connect();
    console.log('  Connected to database for policy cleanup.');

    for (const { schema, table } of tablesToClean) {
      const policyQuery = `
        SELECT policyname
        FROM pg_catalog.pg_policies
        WHERE schemaname = $1 AND tablename = $2;
      `;
      const res = await client.query(policyQuery, [schema, table]);

      if (res.rows.length > 0) {
        console.log(`  Found ${res.rows.length} policies on ${schema}.${table}. Dropping...`);
        for (const row of res.rows) {
          const policyName = row.policyname;
          // Use double quotes for safety with potentially reserved keywords or special chars
          const dropCmd = `DROP POLICY IF EXISTS "${policyName}" ON "${schema}"."${table}";`;
          console.log(`    Executing: ${dropCmd}`);
          await client.query(dropCmd);
        }
      } else {
        console.log(`  No policies found on ${schema}.${table}.`);
      }
    }
    console.log(`
--- Completed policy cleanup ---`);
  } catch (error: any) {
    console.error(`
--- Error during policy cleanup:`, error.message || error);
    throw error; // Re-throw to fail the main script
  } finally {
    await client.end();
    console.log('  Database connection closed after policy cleanup.');
  }
}

// --- Utility to reset the remote database using PSQL ---
async function resetRemoteDatabase() {
  console.log(`
--- Resetting Remote Self-Hosted Database via PSQL ---`);
  try {
    // 1. Drop existing custom policies before dropping schema
    //    (Schema drop might fail if policies depend on functions/types within it)
    await dropExistingPolicies();

    // 2. Drop the public schema
    await runPsqlCommand('DROP SCHEMA public CASCADE;');
    // 3. Recreate the public schema
    await runPsqlCommand('CREATE SCHEMA public;');
    // 4. Grant basic privileges
    await runPsqlCommand('GRANT ALL ON SCHEMA public TO postgres;');
    await runPsqlCommand('GRANT ALL ON SCHEMA public TO public;');
    
    console.log(`
--- Completed: Remote Database Schema Reset via PSQL ---`);
  } catch (error: any) {
    console.error(`
--- Error resetting remote database via PSQL:`, error.message || error);
    throw error; 
  }
}

// --- Main Reset and Migrate Function ---
async function resetAndMigrateRemoteInstance() {
  console.log('🚀 Starting Remote Supabase Instance RESET and Migration...');

  try {
    // 1. Reset Remote Database using PSQL (includes policy drop)
    await resetRemoteDatabase();

    // 2. Run the migration script
    console.log(`
--- Executing migration script: scripts/remote-db-migrate.ts ---`);
    await runCommand('tsx', ['scripts/remote-db-migrate.ts']); 

    console.log(`
✅ Remote instance RESET and migration tasks completed successfully!`);

  } catch (error) {
    console.error(`
❌ Remote instance reset and migration failed!`);
    process.exit(1);
  }
}

// --- Run the reset and migrate process ---
resetAndMigrateRemoteInstance(); 