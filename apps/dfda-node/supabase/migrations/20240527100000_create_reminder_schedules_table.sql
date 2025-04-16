-- Migration: Create reminder_schedules table for user variable reminders

BEGIN;

CREATE TABLE public.reminder_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Link to the item needing the reminder (start with user_variables)
  user_variable_id UUID NOT NULL REFERENCES public.user_variables(id) ON DELETE CASCADE,

  is_active BOOLEAN NOT NULL DEFAULT TRUE, -- To easily toggle reminders on/off

  -- --- Recurrence Rule (iCalendar RFC 5545) ---
  rrule TEXT NOT NULL, 

  -- --- Time & Timing ---
  time_of_day TIME WITHOUT TIME ZONE NOT NULL, 

  -- --- Validity Period ---
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP WITH TIME ZONE,

  -- --- Scheduling & Performance ---
  next_trigger_at TIMESTAMP WITH TIME ZONE, -- Index this column!

  -- --- Optional Notification Customization ---
  notification_title_template TEXT,
  notification_message_template TEXT,

  -- --- Timestamps ---
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --- Indexes ---
CREATE INDEX idx_reminder_schedules_next_trigger_at ON public.reminder_schedules (next_trigger_at);
CREATE INDEX idx_reminder_schedules_user_id ON public.reminder_schedules (user_id);
CREATE INDEX idx_reminder_schedules_user_variable_id ON public.reminder_schedules (user_variable_id);
CREATE INDEX idx_reminder_schedules_is_active ON public.reminder_schedules (is_active);

-- --- Row Level Security (RLS) --- 
-- Enable RLS
ALTER TABLE public.reminder_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Allow users to manage their own reminder schedules
CREATE POLICY "Allow individual user access to their own schedules" 
  ON public.reminder_schedules
  FOR ALL
  USING (auth.uid() = user_id);

-- Grant access to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminder_schedules TO authenticated;

-- Add comments to table and columns
COMMENT ON TABLE public.reminder_schedules IS 'Stores user-defined schedules for reminders, initially for user variables.';
COMMENT ON COLUMN public.reminder_schedules.rrule IS 'Recurrence rule string following the iCalendar RFC 5545 standard.';
COMMENT ON COLUMN public.reminder_schedules.next_trigger_at IS 'The next calculated UTC timestamp when the reminder should trigger. Used for efficient querying.';
COMMENT ON COLUMN public.reminder_schedules.user_variable_id IS 'The specific user variable this reminder schedule is for.';

-- Trigger function to update 'updated_at' timestamp on modification
CREATE OR REPLACE FUNCTION public.set_current_timestamp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update 'updated_at'
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.reminder_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.set_current_timestamp_updated_at();

COMMIT; 