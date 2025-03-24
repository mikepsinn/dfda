-- Appointment Reminders
CREATE TABLE scheduling.appointment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES scheduling.appointments(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL CHECK (reminder_type IN ('email', 'sms', 'push')),
    scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE scheduling.appointment_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own reminders"
    ON scheduling.appointment_reminders FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM scheduling.appointments a
        WHERE a.id = appointment_id
        AND (a.client_id = auth.uid() OR EXISTS (
            SELECT 1 FROM scheduling.service_providers sp
            WHERE sp.id = a.provider_id
            AND sp.user_id = auth.uid()
        ))
    )); 