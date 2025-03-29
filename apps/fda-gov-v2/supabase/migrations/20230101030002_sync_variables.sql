-- Create sync functions for conditions and treatments
CREATE OR REPLACE FUNCTION sync_condition_to_global_variable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO global_variables (id, category_id, name, description)
  VALUES (NEW.id::text, 'conditions', NEW.name, NEW.description)
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION sync_treatment_to_global_variable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO global_variables (id, category_id, name, description)
  VALUES (NEW.id::text, 'treatments', NEW.name, NEW.description)
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      description = EXCLUDED.description;
  RETURN NEW;
END;
$$; 