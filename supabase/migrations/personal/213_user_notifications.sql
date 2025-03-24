-- User Notifications
--
-- User-specific notifications and reminders
-- Handles various types of medical notifications and alerts
--
CREATE TABLE personal.user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    status VARCHAR(20) DEFAULT 'PENDING',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    triggered_by_table VARCHAR(100),
    triggered_by_id UUID,
    action_type VARCHAR(50),
    action_data JSONB,
    read_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE personal.user_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
    ON personal.user_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own notifications"
    ON personal.user_notifications FOR ALL
    USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_status 
    ON personal.user_notifications(user_id, status);
    
CREATE INDEX idx_notifications_scheduled 
    ON personal.user_notifications(scheduled_for)
    WHERE status = 'PENDING';

-- Notification Types
CREATE TYPE personal.notification_type AS ENUM (
    'MEDICATION_REMINDER',
    'LAB_RESULT',
    'APPOINTMENT_REMINDER',
    'MEASUREMENT_REMINDER',
    'CONDITION_UPDATE',
    'CORRELATION_FOUND',
    'TREATMENT_SUGGESTION',
    'DATA_IMPORT_COMPLETE',
    'SYSTEM_ALERT'
);

-- Notification Priorities
CREATE TYPE personal.notification_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);

-- Notification Statuses
CREATE TYPE personal.notification_status AS ENUM (
    'PENDING',
    'SENT',
    'READ',
    'ACTIONED',
    'DISMISSED',
    'FAILED'
);

-- Action Types
CREATE TYPE personal.notification_action_type AS ENUM (
    'VIEW_RECORD',
    'TAKE_MEASUREMENT',
    'CONFIRM_MEDICATION',
    'UPDATE_STATUS',
    'EXTERNAL_LINK',
    'CUSTOM_ACTION'
);

-- Add constraints using the new types
ALTER TABLE personal.user_notifications
    ALTER COLUMN type TYPE personal.notification_type USING type::personal.notification_type,
    ALTER COLUMN priority TYPE personal.notification_priority USING priority::personal.notification_priority,
    ALTER COLUMN status TYPE personal.notification_status USING status::personal.notification_status,
    ALTER COLUMN action_type TYPE personal.notification_action_type USING action_type::personal.notification_action_type;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION personal.mark_notification_read(notification_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE personal.user_notifications
    SET status = 'READ',
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = notification_id
    AND auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to dismiss notification
CREATE OR REPLACE FUNCTION personal.dismiss_notification(notification_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE personal.user_notifications
    SET status = 'DISMISSED',
        updated_at = NOW()
    WHERE id = notification_id
    AND auth.uid() = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new notification
CREATE OR REPLACE FUNCTION personal.create_notification(
    p_user_id UUID,
    p_type personal.notification_type,
    p_title VARCHAR(255),
    p_message TEXT,
    p_priority personal.notification_priority DEFAULT 'NORMAL',
    p_scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_action_type personal.notification_action_type DEFAULT NULL,
    p_action_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO personal.user_notifications (
        user_id,
        type,
        title,
        message,
        priority,
        scheduled_for,
        action_type,
        action_data
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_priority,
        p_scheduled_for,
        p_action_type,
        p_action_data
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 