-- supabase/migrations/<timestamp>_graphile_worker_schema.sql
-- Based on graphile-worker v0.16.6 schema
-- See: https://github.com/graphile/worker

begin;

create extension if not exists "http" with schema "extensions";

create extension if not exists "postgres_fdw" with schema "extensions";



-- Create the schema for graphile-worker
create schema if not exists graphile_worker;

-- Lock the schema so that only the worker migration process can modify it
-- grant usage on schema graphile_worker to :DATABASE_OWNER;
-- alter default privileges in schema graphile_worker grant usage on sequences to :DATABASE_OWNER;
-- alter default privileges in schema graphile_worker grant execute on functions to :DATABASE_OWNER;
-- alter role :DATABASE_OWNER set search_path = "$user", public, graphile_worker;

-- Ensure the pgcrypto extension is available
create extension if not exists pgcrypto with schema public;

-- Graphile Worker tables
create table graphile_worker.migrations (
  id int primary key,
  ts timestamptz not null default now()
);
alter table graphile_worker.migrations owner to postgres;
insert into graphile_worker.migrations (id) values (1);

create table graphile_worker.job_queues (
  queue_name text not null primary key,
  job_count int not null default 0,
  locked_at timestamptz,
  locked_by text
);
alter table graphile_worker.job_queues owner to postgres;

create table graphile_worker.jobs (
  id bigint primary key generated always as identity,
  queue_name text null default null,
  task_identifier text not null,
  payload json not null default '{}'::json,
  priority int not null default 0,
  run_at timestamptz not null default now(),
  attempts int not null default 0,
  max_attempts int not null default 25,
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  key text null,
  locked_at timestamptz null,
  locked_by text null,
  revision int not null default 0,
  flags jsonb null,
  constraint jobs_key_unique unique(key)
);
alter table graphile_worker.jobs owner to postgres;
create index jobs_priority_run_at_id_idx on graphile_worker.jobs (priority, run_at, id);
create index jobs_queue_name_locked_at_without_row_locking on graphile_worker.jobs (queue_name, locked_at) where locked_at is null;
-- Preventing basic LISTEN/NOTIFY issues on AWS RDS/Aurora: https://github.com/graphile/worker/issues/146
create index jobs_queue_name_id_idx on graphile_worker.jobs (queue_name, id) where queue_name is not null;
create index jobs_task_identifier_idx on graphile_worker.jobs (task_identifier);

-- Function to notify worker of new jobs
create function graphile_worker.notify_new_jobs() returns trigger as $$
declare
  v_job_count int;
begin
  select count(*) into v_job_count from new_table;
  if v_job_count > 0 then
    -- Ensure there are jobs
    perform pg_notify('jobs:insert', '‽'::text || json_build_object('count', v_job_count)::text);
  end if;
  return null;
end;
$$ language plpgsql volatile;
alter function graphile_worker.notify_new_jobs() owner to postgres;

-- Trigger to notify worker
create trigger _900_notify_new_jobs
  after insert on graphile_worker.jobs
  referencing new table as new_table
  for each statement
  execute procedure graphile_worker.notify_new_jobs();

commit; 