-- Migration: Define the standard updated_at trigger function

BEGIN;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Always set updated_at on any UPDATE operation.
    -- Postgres is smart enough to not cause infinite loops
    -- if updated_at is the only column being set in the original UPDATE.
    NEW.updated_at = now(); 
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER; -- Use SECURITY DEFINER if needed, or INVOKER

-- No grants needed here typically, permissions are checked at trigger execution time

COMMIT; 