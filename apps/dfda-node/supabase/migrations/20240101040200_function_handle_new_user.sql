-- Create handle_new_user function
-- Inserts into profiles (if not exists) and creates role-specific records (patients, providers, research_partners)
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
  ELSIF profile_user_type = 'research-partner' THEN
    -- Insert with a default institution name, as it's required
    INSERT INTO public.research_partners (id, institution_name)
    VALUES (NEW.id, '[Pending Institution Name]')
    ON CONFLICT (id) DO NOTHING;
  END IF;
  -- Add other role checks (admin, developer) here if needed

  RETURN NEW;
END;
$$; 