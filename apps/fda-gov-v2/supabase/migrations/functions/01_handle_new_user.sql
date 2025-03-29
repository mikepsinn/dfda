-- Create handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, user_type)
  VALUES (NEW.id, NEW.email, 'patient');

  -- Insert into patients
  INSERT INTO public.patients (id)
  VALUES (NEW.id);

  RETURN NEW;
END;
$$; 