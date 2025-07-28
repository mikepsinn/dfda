-- Trigger function to replace synonym global_variable_id with its canonical counterpart

CREATE OR REPLACE FUNCTION replace_with_canonical_global_variable()
RETURNS TRIGGER AS $$
DECLARE
  canonical_id TEXT;
BEGIN
  -- Check only if global_variable_id is being set/changed
  IF NEW.global_variable_id IS NOT NULL THEN
    -- Find the canonical ID for the given global_variable_id
    SELECT gv.canonical_global_variable_id
    INTO canonical_id
    FROM global_variables gv
    WHERE gv.id = NEW.global_variable_id;

    -- If a canonical ID exists (meaning the provided ID is a synonym), replace it
    IF canonical_id IS NOT NULL THEN
      NEW.global_variable_id := canonical_id;
    END IF;
  END IF;

  -- Return the (potentially modified) row
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to the user_variables table
DROP TRIGGER IF EXISTS enforce_canonical_user_variable_id ON user_variables; -- Drop if exists for idempotency
CREATE TRIGGER enforce_canonical_user_variable_id
BEFORE INSERT OR UPDATE ON user_variables
FOR EACH ROW
EXECUTE FUNCTION replace_with_canonical_global_variable();

-- Apply the trigger to the measurements table
DROP TRIGGER IF EXISTS enforce_canonical_measurement_variable_id ON measurements; -- Drop if exists for idempotency
CREATE TRIGGER enforce_canonical_measurement_variable_id
BEFORE INSERT OR UPDATE ON measurements
FOR EACH ROW
EXECUTE FUNCTION replace_with_canonical_global_variable();
