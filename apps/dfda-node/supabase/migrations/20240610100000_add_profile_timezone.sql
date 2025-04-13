-- Add timezone column to profiles table
ALTER TABLE public.profiles
ADD COLUMN timezone TEXT NULL;

-- Optional: Add a comment to the column
COMMENT ON COLUMN public.profiles.timezone IS 'User''s preferred IANA timezone identifier (e.g., America/New_York)'; 