-- Enable RLS and add policies for user_variables table
ALTER TABLE public.user_variables ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to access their own user_variables
CREATE POLICY "Users can access their own user_variables" ON public.user_variables
  FOR ALL
  USING (user_id = auth.uid()); 