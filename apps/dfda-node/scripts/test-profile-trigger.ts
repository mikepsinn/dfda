import path from 'path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { Client as PgClient } from 'pg'; // Add pg client import
import { randomUUID } from 'node:crypto'; // For generating unique user info
import fs from 'fs/promises'; // Import fs for reading migration file

// --- Load Environment Variables ---
// Load from .env file in the project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

// --- Utility Function to Check Profile Creation Trigger ---
// Extracted from remote-db-migrate.ts
async function checkProfileCreationTrigger() {
  console.log(`
--- Checking Profile Creation Trigger ---`);

  if (!supabaseUrl || !serviceRoleKey || !databaseUrl) {
    console.error('Error: Missing Supabase URL, Service Role Key, or Database URL for trigger check.');
    throw new Error('Missing credentials for trigger check.');
  }

  // Use a unique email and password for the test user
  const testEmail = `test-user-${randomUUID()}@example.com`;
  const testPassword = `password-${randomUUID()}`; // Secure random password
  let testUserId: string | null = null; // Variable to hold the created user ID

  const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
  });
  const pgClient = new PgClient({ connectionString: databaseUrl });
  const triggerMigrationFile = 'supabase/migrations/20240101050000_trigger_auth_handle_new_user.sql';

  try {
    // === Setup: Ensure trigger doesn't exist, then try to run migration ===
    console.log("  Connecting to DB for setup...");
    await pgClient.connect();

    // 1. Drop existing trigger (if any) to ensure a clean slate
    console.log(`  Dropping trigger 'on_auth_user_created' on 'auth.users' if it exists...`);
    try {
        await pgClient.query('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
        console.log("  Trigger drop command executed.");
    } catch (dropError: any) {
        console.error(`  Error dropping trigger:`, dropError.message);
        throw dropError; // Fail fast if cleanup fails
    }

    // 2. Read and execute the trigger migration file
    console.log(`  Attempting to run migration SQL from: ${triggerMigrationFile}`);
    try {
        const migrationSql = await fs.readFile(path.resolve(process.cwd(), triggerMigrationFile), 'utf8');
        console.log("  Executing migration SQL...");
        await pgClient.query(migrationSql);
        console.log("  ✅ SUCCESS: Migration SQL executed.");
    } catch (migrationError: any) {
        console.error(`  ❌ FAILURE: Error executing migration SQL from ${triggerMigrationFile}:`, migrationError.message);
        // Log the SQL that failed
        try {
            const failedSql = await fs.readFile(path.resolve(process.cwd(), triggerMigrationFile), 'utf8');
            console.error("--- Failing SQL ---");
            console.error(failedSql);
            console.error("-------------------");
        } catch (readError) { /* Ignore if reading fails again */ }

        // Check if error indicates permission issue (common pattern)
        if (migrationError.message && migrationError.message.includes('permission denied')) {
             console.error("  Hint: This looks like a database permissions issue. The role used in DATABASE_URL may need CREATE/TRIGGER privileges on the 'auth' schema/table.");
        }

        throw migrationError; // Re-throw to stop the test
    }
    console.log("  Setup completed.");
    // === End Setup ===

    // === Pre-checks for Trigger and Function (Should now pass if migration worked) ===
    console.log("  Connecting to DB for pre-checks...");
    // Ensure connection is still active (might not be needed if not explicitly closed)
    if (!pgClient.database) { await pgClient.connect(); }

    console.log("  Checking for 'handle_new_user' function existence...");
    const funcCheck = await pgClient.query("SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user';");
    if (funcCheck.rowCount === 0) {
        console.error("  ❌ FAILURE: Function 'handle_new_user' not found in pg_proc.");
        throw new Error("Function 'handle_new_user' does not exist.");
    } else {
        console.log("  ✅ SUCCESS: Function 'handle_new_user' found.");
    }

    console.log("  Checking for trigger on 'auth.users'...");
    // Note: Supabase might name the trigger differently, adjust 'trg_new_user' if needed
    const triggerCheck = await pgClient.query(
      "SELECT 1 FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND tgname = 'on_auth_user_created';"
      // "SELECT 1 FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND tgfoid = 'handle_new_user'::regproc;" // Alternative check by function OID
    );
    if (triggerCheck.rowCount === 0) {
        console.error("  ❌ FAILURE: Trigger 'on_auth_user_created' not found on 'auth.users'.");
        // Attempt to check by function name as well, in case the trigger name differs
         const triggerFuncCheck = await pgClient.query(
            "SELECT 1 FROM pg_trigger WHERE tgrelid = 'auth.users'::regclass AND tgfoid = 'handle_new_user'::regproc;"
        );
         if (triggerFuncCheck.rowCount === 0) {
            console.error("  ❌ FAILURE: No trigger found on 'auth.users' calling 'handle_new_user'.");
            throw new Error("Trigger for 'handle_new_user' not found on 'auth.users'.");
         } else {
             console.log("  ⚠️ WARNING: Trigger name might differ, but a trigger calling 'handle_new_user' exists on 'auth.users'.");
         }
    } else {
        console.log("  ✅ SUCCESS: Trigger 'on_auth_user_created' found on 'auth.users'.");
    }
    // Close connection used for pre-checks; will reconnect if needed later or reuse.
    // For simplicity here, we'll just let the main logic reconnect/reuse if necessary.
    // await pgClient.end(); // Optional: close here if you want isolation
    console.log("  Pre-checks completed.");
    // === End Pre-checks ===


    // 1. Create the test user
    console.log(`  Creating test user: ${testEmail}`);
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Create user as confirmed
    });

    if (userError) {
      console.error(`  Failed to create test user:`, userError.message);
      throw userError;
    }
    if (!userData?.user?.id) {
        throw new Error('Test user created but ID was missing.');
    }
    testUserId = userData.user.id;
    console.log(`  Test user created with ID: ${testUserId}`);

    // 2. Wait for the trigger to potentially fire and commit
    const delayMs = 2000; // Wait 2 seconds (adjust if needed)
    console.log(`  Waiting ${delayMs}ms for trigger processing...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));

    // 3. Connect to DB and check for the profile row
    console.log(`  Connecting to DB to check profile...`);
    // Ensure connection is active if closed during pre-checks
    if (!pgClient.database) { // Simple check if connection might be closed
        await pgClient.connect();
    }
    const checkQuery = 'SELECT 1 FROM public.profiles WHERE id = $1';
    console.log(`  Executing query: ${checkQuery} with ID: ${testUserId}`);
    const { rowCount } = await pgClient.query(checkQuery, [testUserId]);

    // 4. Verify profile existence
    if (rowCount === 1) {
      console.log(`  ✅ SUCCESS: Profile row found for test user ${testUserId}. Trigger appears functional.`);
    } else {
      console.error(`  ❌ FAILURE: Profile row NOT found for test user ${testUserId}.`);
      console.error(`  This indicates the handle_new_user trigger failed to create the profile.`);
      throw new Error('Profile creation trigger check failed.');
    }

  } catch (error: any) {
    console.error(`
--- Error during profile trigger check:`, error.message || error);
    // Re-throw the error to stop the overall script
    throw error;
  } finally {
    // 5. Cleanup: Delete the test user and close DB connection
    if (testUserId) {
      console.log(`  Cleaning up test user: ${testUserId}`);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(testUserId);
      if (deleteError) {
        // Log cleanup error but don't necessarily fail the script if the check passed
        console.warn(`  Warning: Failed to clean up test user ${testUserId}:`, deleteError.message);
      } else {
        console.log(`  Successfully deleted test user ${testUserId}.`);
      }
    }
    // Check if pgClient was initialized before trying to end
    if (pgClient && typeof pgClient.end === 'function') {
       try {
          await pgClient.end();
          console.log(`  DB connection closed after trigger check.`);
       } catch (endError: any) {
          console.warn(`  Warning: Error closing DB connection after trigger check:`, endError.message);
       }
    }
     console.log(`
--- Completed Profile Creation Trigger Check ---`);
  }
}

// --- Main Execution Function ---
async function runTriggerTest() {
  console.log('🚀 Starting Profile Creation Trigger Test...');
  try {
    await checkProfileCreationTrigger();
    console.log(`
Profile creation trigger test completed successfully!
`);
  } catch (error) {
    console.error(`
Profile creation trigger test failed!
Error: ${error instanceof Error ? error.message : String(error)}
`);
    process.exit(1); // Exit with error code
  }
}

// --- Run the test ---
runTriggerTest(); 