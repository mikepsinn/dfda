-- Trigger to execute handle_profile_role_update when user_type is set
CREATE TRIGGER on_profile_role_set
  AFTER UPDATE OF user_type ON public.profiles -- Fire only when user_type column is updated
  FOR EACH ROW
  WHEN (OLD.user_type IS NULL AND NEW.user_type IS NOT NULL) -- Fire only when changing from NULL to non-NULL
  EXECUTE FUNCTION public.handle_profile_role_update(); 