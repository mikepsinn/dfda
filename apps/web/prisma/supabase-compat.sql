-- Supabase compatibility layer for a plain PostgreSQL database.
--
-- The SQL migrations in supabase/migrations were written for Supabase. They
-- use the anon/authenticated/service_role roles, auth.uid()/auth.role(), the
-- auth.users table, the extensions schema and storage.objects policies. This
-- file creates minimal equivalents so that the same migrations run on plain
-- PostgreSQL (local tests and CI). It does nothing on a Supabase database,
-- where these objects already exist.
--
-- auth.uid() and auth.role() read the same request.jwt.claims setting as
-- Supabase. lib/db sets it for each user-scoped query, so the existing
-- row-level security policies apply unchanged.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN NOINHERIT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN NOINHERIT BYPASSRLS;
  END IF;
END
$$;

-- The connecting user must be able to switch to these roles.
DO $$
BEGIN
  EXECUTE format('GRANT anon, authenticated, service_role TO %I', current_user);
END
$$;

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;

CREATE SCHEMA IF NOT EXISTS auth;
GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  encrypted_password text,
  email_confirmed_at timestamptz,
  raw_app_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  raw_user_meta_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF to_regprocedure('auth.uid()') IS NULL THEN
    EXECUTE $fn$
      CREATE FUNCTION auth.uid() RETURNS uuid
      LANGUAGE sql STABLE
      AS $body$
        SELECT coalesce(
          nullif(current_setting('request.jwt.claim.sub', true), ''),
          (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
        )::uuid
      $body$
    $fn$;
  END IF;
  IF to_regprocedure('auth.role()') IS NULL THEN
    EXECUTE $fn$
      CREATE FUNCTION auth.role() RETURNS text
      LANGUAGE sql STABLE
      AS $body$
        SELECT coalesce(
          nullif(current_setting('request.jwt.claim.role', true), ''),
          (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
        )::text
      $body$
    $fn$;
  END IF;
  IF to_regprocedure('auth.jwt()') IS NULL THEN
    EXECUTE $fn$
      CREATE FUNCTION auth.jwt() RETURNS jsonb
      LANGUAGE sql STABLE
      AS $body$
        SELECT coalesce(
          nullif(current_setting('request.jwt.claims', true), ''),
          '{}'
        )::jsonb
      $body$
    $fn$;
  END IF;
END
$$;

-- Minimal storage schema, so that the storage policies in the migrations
-- apply. File contents are not stored here.
CREATE SCHEMA IF NOT EXISTS storage;
GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text NOT NULL,
  public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets (id),
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regprocedure('storage.foldername(text)') IS NULL THEN
    EXECUTE $fn$
      CREATE FUNCTION storage.foldername(name text) RETURNS text[]
      LANGUAGE sql IMMUTABLE
      AS $body$
        SELECT (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1]
      $body$
    $fn$;
  END IF;
END
$$;

-- Supabase gives these roles access to everything in the public schema and
-- relies on row-level security to limit rows.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
