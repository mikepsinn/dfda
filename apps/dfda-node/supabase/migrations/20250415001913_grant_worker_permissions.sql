-- supabase/migrations/<timestamp>_grant_worker_permissions.sql

-- Grant usage on the schema to the authenticated role
GRANT USAGE ON SCHEMA graphile_worker TO authenticated;

-- Grant permissions on the jobs table to the authenticated role
-- The enqueue function needs INSERT. Worker might need SELECT/UPDATE/DELETE later.
GRANT INSERT, SELECT, UPDATE, DELETE ON TABLE graphile_worker.jobs TO authenticated;

-- Grant usage on the jobs_id_seq sequence (needed for INSERT)
GRANT USAGE ON SEQUENCE graphile_worker.jobs_id_seq TO authenticated;

-- Also grant execute on the function itself to the authenticated role
-- (Assuming the function remains in the public schema as defined previously)
GRANT EXECUTE ON FUNCTION public.enqueue_graphile_job(text, jsonb, text, timestamptz, integer, text, integer) TO authenticated; 