-- What a user can change in their own profile: their name, avatar and time
-- zone, and their role once, from none to a role that they can choose
-- (/select-role, or "patient" when they join a program). The email, the
-- dates and the account's state belong to the server: the auth hooks and the
-- admin client set them, and report emails go to the email.
--
-- Before this, the policy "Users can update own profile" let a user change
-- every column of their row, the role "admin" included, which the policies of
-- 20240101070400_policy_action.sql trust.

REVOKE UPDATE ON public.profiles FROM anon, authenticated;
GRANT UPDATE (first_name, last_name, avatar_url, timezone, user_type, updated_at) ON public.profiles TO authenticated;

-- A user sets their role once, and never to admin; the server's admin client can change any role.
CREATE OR REPLACE FUNCTION public.check_profile_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND NEW.user_type IS DISTINCT FROM OLD.user_type
     AND (OLD.user_type IS NOT NULL OR NEW.user_type NOT IN ('patient', 'provider', 'research_partner', 'developer')) THEN
    RAISE EXCEPTION 'A user chooses their role once, and not the admin role.' USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_profile_role_change ON public.profiles;
CREATE TRIGGER check_profile_role_change
  BEFORE UPDATE OF user_type ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_profile_role_change();
