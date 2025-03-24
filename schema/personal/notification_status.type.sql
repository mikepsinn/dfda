-- Type: personal.notification_status

CREATE TYPE personal.notification_status AS ENUM (
    'PENDING',
    'SENT',
    'READ',
    'ACTIONED',
    'DISMISSED',
    'FAILED'
);
