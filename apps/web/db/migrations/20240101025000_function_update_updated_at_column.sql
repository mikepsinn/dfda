-- Migration: Define the standard updated_at trigger function

BEGIN;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the operation is an UPDATE to avoid issues if
    -- the trigger were accidentally applied to INSERTs.
    -- Also check if the row data has actually changed.
    IF (TG_OP = 'UPDATE' AND NEW IS DISTINCT FROM OLD) THEN
        NEW.updated_at = now(); 
    END IF;
    RETURN NEW; -- Return the row (modified or not) to proceed
END;
$$ language 'plpgsql'; -- Removed SECURITY DEFINER, default is INVOKER which is safer here

-- Add a comment for clarity
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Standard trigger function to automatically set updated_at to the current timestamp on row update if the row has changed.';

COMMIT; 