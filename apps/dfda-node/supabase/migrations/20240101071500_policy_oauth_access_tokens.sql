-- Enable RLS and add policies for oauth_access_tokens table
ALTER TABLE public.oauth_access_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to access their own access tokens
CREATE POLICY "Users can access their own oauth access tokens" ON public.oauth_access_tokens
  FOR ALL
  USING (user_id = auth.uid()); 