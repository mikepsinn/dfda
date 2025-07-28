-- Migration: Create trigger to add initial synonym on global_variable insert

-- Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_global_variable_synonym()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER -- Necessary if RLS might prevent direct insert
AS $$
BEGIN
  -- Insert the initial name as the first synonym
  INSERT INTO public.global_variable_synonyms (global_variable_id, name)
  VALUES (NEW.id, NEW.name);
  RETURN NEW;
END;
$$;

-- Trigger
CREATE TRIGGER on_global_variable_created_add_synonym
  AFTER INSERT ON public.global_variables
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_global_variable_synonym();

COMMENT ON FUNCTION public.handle_new_global_variable_synonym() IS 'Automatically adds the initial name of a new global variable as its first synonym.';
COMMENT ON TRIGGER on_global_variable_created_add_synonym ON public.global_variables IS 'When a global variable is created, add its name as an initial synonym.'; 