-- supabase/migrations/<timestamp>_func_enqueue_graphile_job.sql

CREATE OR REPLACE FUNCTION public.enqueue_graphile_job (
  task_identifier text,
  payload jsonb default '{}'::jsonb, -- Use jsonb for better indexing/querying
  queue_name text default null,
  run_at timestamptz default now(),
  max_attempts integer default 25,
  job_key text default null,
  priority integer default 0
)
RETURNS graphile_worker.jobs -- Optional: Return the created job
LANGUAGE sql
AS $$
  INSERT INTO graphile_worker.jobs
    (task_identifier, payload, queue_name, run_at, max_attempts, key, priority)
  VALUES
    (task_identifier, payload, queue_name, run_at, max_attempts, job_key, priority)
  RETURNING *;
$$;

-- Optional: Grant execute permission to the authenticated role if actions run as 'authenticated'
-- GRANT EXECUTE ON FUNCTION public.enqueue_graphile_job(text, jsonb, text, timestamptz, integer, text, integer) TO authenticated;

-- Optional: Grant execute permission to the service_role if actions run with admin privileges
-- GRANT EXECUTE ON FUNCTION public.enqueue_graphile_job(text, jsonb, text, timestamptz, integer, text, integer) TO service_role; 