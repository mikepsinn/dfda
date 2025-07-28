-- Enable RLS and add policies for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow users to access their own notifications
CREATE POLICY "Users can access their own notifications" ON public.notifications
  FOR ALL
  USING (user_id = auth.uid()); 