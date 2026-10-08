-- Enable RLS and add policies for oauth_refresh_tokens table
ALTER TABLE public.oauth_refresh_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to access their own refresh tokens
CREATE POLICY "Users can access their own oauth refresh tokens" ON public.oauth_refresh_tokens
  FOR ALL
  USING (user_id = auth.uid()); 