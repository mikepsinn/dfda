-- Enum for notification status
CREATE TYPE reminder_notification_status AS ENUM (
  'pending',    -- Notification generated, waiting for user action
  'completed',  -- User logged data for this notification
  'skipped',    -- User explicitly skipped this notification
  'error'       -- System encountered an error processing this (optional)
);

-- Table to store individual notification instances
CREATE TABLE reminder_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_schedule_id UUID NOT NULL REFERENCES reminder_schedules(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  notification_trigger_at TIMESTAMPTZ NOT NULL, -- The exact time this notification was due
  status reminder_notification_status NOT NULL DEFAULT 'pending',

  -- Optional: Link to the data logged for this notification
  -- Choose ONE approach or adapt as needed:
  -- 1. Direct link to measurement (if only measurements)
  -- measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
  -- 2. Generic JSONB storage for log details
  log_details JSONB NULL, 
  -- 3. Specific columns for different log types (more complex)
  -- logged_measurement_id UUID REFERENCES measurements(id) ON DELETE SET NULL,
  -- logged_adherence_status BOOLEAN NULL,
  -- logged_severity INTEGER NULL, 

  completed_or_skipped_at TIMESTAMPTZ NULL, -- When the user acted on it

  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

  CONSTRAINT reminder_notifications_schedule_trigger_unique UNIQUE (reminder_schedule_id, notification_trigger_at)
);

-- Indexes
CREATE INDEX idx_reminder_notifications_user_status_trigger 
  ON reminder_notifications (user_id, status, notification_trigger_at DESC);

CREATE INDEX idx_reminder_notifications_schedule_id
  ON reminder_notifications (reminder_schedule_id);

-- Enable Row Level Security
ALTER TABLE reminder_notifications ENABLE ROW LEVEL SECURITY;

-- Trigger for updated_at
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON reminder_notifications
  FOR EACH ROW
  EXECUTE PROCEDURE moddatetime (updated_at); 