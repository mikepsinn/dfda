-- Type: personal.notification_action_type

CREATE TYPE personal.notification_action_type AS ENUM (
    'VIEW_RECORD',
    'TAKE_MEASUREMENT',
    'CONFIRM_MEDICATION',
    'UPDATE_STATUS',
    'EXTERNAL_LINK',
    'CUSTOM_ACTION'
);
