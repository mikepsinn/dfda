-- Use identifier-safe enum values.
--
-- Prisma turns enum values that are not valid identifiers into different
-- TypeScript values (for example 'research-partner' becomes 'research_partner'
-- with an @map). Renaming the database values keeps one spelling in SQL,
-- TypeScript and stored data. Policies refer to enum values by their internal
-- id and follow the rename; the two functions below compare text literals and
-- are replaced with the new spelling.

ALTER TYPE public.user_type_enum RENAME VALUE 'research-partner' TO 'research_partner';
ALTER TYPE public.form_question_type RENAME VALUE 'multiple-choice' TO 'multiple_choice';
ALTER TYPE public.evidence_certainty_enum RENAME VALUE 'Very Low' TO 'Very_Low';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  profile_user_type public.user_type_enum;
BEGIN
  -- Insert into profiles, do nothing if profile already exists
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;

  -- Check the user_type from the metadata provided during sign up
  -- Note: This relies on user_type being correctly passed in raw_user_meta_data
  -- or being updated later.
  profile_user_type := (NEW.raw_user_meta_data ->> 'user_type')::public.user_type_enum;

  -- Create role-specific records based on user_type
  IF profile_user_type = 'patient' THEN
    INSERT INTO public.patients (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  ELSIF profile_user_type = 'provider' THEN
    INSERT INTO public.providers (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
  ELSIF profile_user_type = 'research_partner' THEN
    -- Insert with a default institution name, as it's required
    INSERT INTO public.research_partners (id, institution_name)
    VALUES (NEW.id, '[Pending Institution Name]')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  -- Add other role checks (admin, developer) here if needed

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_profile_role_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER -- Changed back to INVOKER
SET search_path = public -- Use INVOKER to run as the user updating the profile
AS $$
BEGIN
  -- Check if user_type was actually updated and is now NOT NULL
  -- The trigger's WHEN clause handles the primary condition, but an extra check here is safe.
  IF NEW.user_type IS NOT NULL AND OLD.user_type IS DISTINCT FROM NEW.user_type THEN
    
    -- Create role-specific records based on the NEW user_type
    -- Use ON CONFLICT DO NOTHING to avoid errors if the record somehow already exists
    IF NEW.user_type = 'patient' THEN
      INSERT INTO public.patients (id)
      VALUES (NEW.id)
      ON CONFLICT (id) DO NOTHING;
    ELSIF NEW.user_type = 'provider' THEN
      INSERT INTO public.providers (id)
      VALUES (NEW.id)
      ON CONFLICT (id) DO NOTHING;
    ELSIF NEW.user_type = 'research_partner' THEN
      -- Ensure required fields like institution_name have defaults if necessary
      -- For now, assuming only 'id' is needed initially or defaults exist
      INSERT INTO public.research_partners (id, institution_name)
      VALUES (NEW.id, '[Pending Update]') -- Example default
      ON CONFLICT (id) DO NOTHING;
    ELSIF NEW.user_type = 'developer' THEN
      -- Assuming no separate developer table, or add insert here if one exists
      NULL; -- No action needed for developer if no specific table
    -- Add other role checks (admin) if needed
    END IF;

  END IF;

  RETURN NEW;
END;
$$;
