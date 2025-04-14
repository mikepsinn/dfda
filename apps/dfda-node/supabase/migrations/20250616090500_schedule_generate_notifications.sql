-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
-- Enable HTTP extension for pg_cron to make requests
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
-- Enable postgres_fdw (often a dependency for http)
CREATE EXTENSION IF NOT EXISTS postgres_fdw WITH SCHEMA extensions;

-- Grant usage to postgres role if needed
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT USAGE ON SCHEMA net TO postgres;

-- Grant execute permission on the Edge Function invocation URL (adjust if needed)
-- This usually requires allowing the postgres user to make HTTP requests or using Supabase secrets
-- For simplicity here, we assume direct function calls or a secure proxy setup.

-- Remove any existing schedule for this function
-- Use DO $$ BEGIN...END $$ to handle potential errors if job doesn't exist
DO $$
BEGIN
  PERFORM cron.unschedule('generate-notifications');
EXCEPTION
  WHEN OTHERS THEN -- Catch errors (like job not found) and ignore
    RAISE NOTICE 'Could not unschedule job generate-notifications: %', SQLERRM;
END;
$$;

-- Schedule the function with valid local defaults
-- This will be overwritten by the configure-local-cron.ts script later
SELECT cron.schedule(
  'generate-notifications', -- Job name
  '*/5 * * * *', -- Cron schedule: every 5 minutes
  $$
  SELECT net.http_post(
      -- Use a valid-looking local URL structure as a placeholder
      url:='http://localhost:54321/functions/v1/generate-notifications', 
      headers:='{
          "Content-Type": "application/json", 
          "Authorization": "Bearer dummy-service-key-placeholder"
      }'::jsonb,
      body:='{"job":"generate-notifications"}'::jsonb,
      timeout_milliseconds:= 5000 -- Add a timeout
  );
  $$
);

-- Example using Supabase secrets (Recommended):
-- Assuming you have a secret named 'EDGE_FUNCTION_SERVICE_KEY' containing your service role key or a dedicated secure token
-- SELECT cron.schedule(
--   'generate-notifications',
--   '*/5 * * * *',
--   $$
--   SELECT net.http_post(
--       url:=current_setting('custom.edge_function_base_url') || '/generate-notifications', -- Base URL from custom config
--       headers:=jsonb_build_object(
--           'Content-Type', 'application/json',
--           'Authorization', 'Bearer ' || secrets.get('EDGE_FUNCTION_SERVICE_KEY')
--       ),
--       body:= '{"job":"generate-notifications"}'::jsonb
--   );
--   $$
-- );

-- Grant execute permission on http_post to the postgres user
-- Note: Adjust role if your cron jobs run as a different user locally
GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO postgres;

-- Ensure the cron user can use net.http_post
-- GRANT USAGE ON SCHEMA net TO anondb_role_for_cron; -- Replace with the actual role cron runs as if needed
-- ALTER DEFAULT PRIVILEGES IN SCHEMA net GRANT EXECUTE ON FUNCTIONS TO anondb_role_for_cron; 