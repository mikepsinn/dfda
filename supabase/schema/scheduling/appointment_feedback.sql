-- Appointment Feedback
CREATE TABLE scheduling.appointment_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES scheduling.appointments(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    feedback_text TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(appointment_id)
);

-- Enable Row Level Security
ALTER TABLE scheduling.appointment_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Clients can view their own feedback"
    ON scheduling.appointment_feedback FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM scheduling.appointments a
        WHERE a.id = appointment_id
        AND a.client_id = auth.uid()
    ));

CREATE POLICY "Providers can view appointment feedback"
    ON scheduling.appointment_feedback FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM scheduling.appointments a
        JOIN scheduling.service_providers sp ON sp.id = a.provider_id
        WHERE a.id = appointment_id
        AND sp.user_id = auth.uid()
    ));

CREATE POLICY "Clients can create feedback"
    ON scheduling.appointment_feedback FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM scheduling.appointments a
        WHERE a.id = appointment_id
        AND a.client_id = auth.uid()
        AND a.status = 'completed'
    )); 