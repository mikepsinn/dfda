-- Enable RLS and add policies for measurements table
ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to access their own measurements
CREATE POLICY "Users can access their own measurements" ON public.measurements
  FOR ALL
  USING (user_id = auth.uid()); 