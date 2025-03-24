-- Alter: personal.user_notifications
-- Alter statements for personal.user_notifications

ALTER TABLE personal.user_notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE personal.user_notifications
    ALTER COLUMN type TYPE personal.notification_type USING type::personal.notification_type,
    ALTER COLUMN priority TYPE personal.notification_priority USING priority::personal.notification_priority,
    ALTER COLUMN status TYPE personal.notification_status USING status::personal.notification_status,
    ALTER COLUMN action_type TYPE personal.notification_action_type USING action_type::personal.notification_action_type;
