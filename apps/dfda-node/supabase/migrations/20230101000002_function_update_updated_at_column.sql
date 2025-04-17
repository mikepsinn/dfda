-- Migration: Define the standard updated_at trigger function

BEGIN;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if updated_at column exists in the NEW record
    -- This makes the function slightly more robust if accidentally
    -- applied to a table without the column, though the trigger
    -- creation would likely fail first in that case.
    IF TG_OP = 'UPDATE' AND NEW ? 'updated_at' THEN
      NEW.updated_at = now();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER; -- Use SECURITY DEFINER if needed, or INVOKER

-- No grants needed here typically, permissions are checked at trigger execution time

COMMIT; 