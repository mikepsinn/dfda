-- Function to create role-specific records when profiles.user_type is updated
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
    ELSIF NEW.user_type = 'research-partner' THEN
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