-- Type: personal.notification_priority

CREATE TYPE personal.notification_priority AS ENUM (
    'LOW',
    'NORMAL',
    'HIGH',
    'URGENT'
);
