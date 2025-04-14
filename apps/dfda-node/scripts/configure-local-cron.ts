import { createClient, SupabaseClient } from '@supabase/supabase-js';
import pg from 'pg'; // Use pg library to execute direct SQL
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env (instead of .env.local)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
// Default local Supabase connection string - adjust if yours differs
const localDbUrl = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@localhost:54322/postgres'; 
// Default local Edge Function base URL - adjust if yours differs
const localEdgeFunctionBaseUrl = process.env.SUPABASE_FUNCTIONS_URL || 'http://localhost:54321/functions/v1'; 
const functionName = 'generate-notifications';
const jobName = 'generate-notifications';
const cronSchedule = '*/5 * * * *'; // Match the schedule in the migration

if (!serviceRoleKey) {
  console.error(
    'Error: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local. Cannot configure cron job.'
  );
  process.exit(1);
}

async function configureLocalCronJob() {
  console.log('Attempting to configure local pg_cron job for generate-notifications...');

  const pool = new pg.Pool({ connectionString: localDbUrl });
  let client: pg.PoolClient | null = null; // Initialize client as null

  try {
    client = await pool.connect();
    console.log('Connected to local database.');

    const functionUrl = `${localEdgeFunctionBaseUrl}/${functionName}`;

    // Ensure pg_cron is available (it should be after db reset)
    await client.query('CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;');
    // Ensure http extension is available
    await client.query('CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;'); // Or just http?
    // Ensure postgres_fdw is available (dependency for http? Check Supabase setup)
    await client.query('CREATE EXTENSION IF NOT EXISTS postgres_fdw WITH SCHEMA extensions;');
    // Ensure net schema exists (dependency for http post?)
    // This might already exist in the Supabase local setup
    // await client.query('CREATE SCHEMA IF NOT EXISTS net;'); 


    // Unschedule existing job first
    console.log(`Unscheduling existing job: ${jobName}`);
    await client.query('SELECT cron.unschedule($1)', [jobName]);

    // Schedule the new job pointing to the local function URL
    const scheduleSql = `
      SELECT cron.schedule(
        $1, -- job name
        $2, -- schedule
        $$
        SELECT net.http_post(
            url:='${functionUrl}',
            headers:='{
                "Content-Type": "application/json", 
                "Authorization": "Bearer ${serviceRoleKey}"
            }'::jsonb,
            body:='{"job":"generate-notifications"}'::jsonb,
            timeout_milliseconds:= 5000
        );
        $$
      );
    `;

    console.log(`Scheduling job '${jobName}' with schedule '${cronSchedule}' to call '${functionUrl}'`);
    await client.query(scheduleSql, [jobName, cronSchedule]);

    console.log(`Successfully configured local pg_cron job: ${jobName}`);

  } catch (error: any) {
    console.error('Error configuring local pg_cron job:', error.message);
    // Don't exit the process, allow the main setup script to continue if desired
    // process.exit(1);
  } finally {
    if (client) {
        client.release(); // Release the client back to the pool
        console.log('Database client released.');
    }
    await pool.end(); // Close the pool
    console.log('Database pool closed.');
  }
}

configureLocalCronJob(); 