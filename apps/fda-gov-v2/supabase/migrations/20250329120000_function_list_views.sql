-- Create function to list views
CREATE OR REPLACE FUNCTION public.list_views()
RETURNS TABLE (
  schema_name text,
  view_name text
) 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT table_schema::text, table_name::text
  FROM information_schema.views 
  WHERE table_schema = 'public';
END;
$$; 