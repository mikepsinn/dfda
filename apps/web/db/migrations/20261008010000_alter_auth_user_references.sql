-- Keep application foreign keys inside the public schema.
--
-- Prisma reads only the public schema, and the app is moving off Supabase
-- Auth. Foreign keys that point to auth.users now point to public.profiles,
-- whose id is the auth user id. A trigger keeps the old cascade: deleting an
-- auth user deletes the profile, and the profile cascade deletes the rest.

ALTER TABLE public.forms
  DROP CONSTRAINT forms_created_by_fkey,
  ADD CONSTRAINT forms_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.oauth_authorization_codes
  DROP CONSTRAINT oauth_authorization_codes_user_id_fkey,
  ADD CONSTRAINT oauth_authorization_codes_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE;

ALTER TABLE public.profiles
  DROP CONSTRAINT profiles_id_fkey;

CREATE OR REPLACE FUNCTION public.handle_deleted_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  DELETE FROM public.profiles WHERE id = OLD.id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_deleted_user();
