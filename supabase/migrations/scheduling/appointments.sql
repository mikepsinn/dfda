-- Appointments
CREATE TABLE scheduling.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES scheduling.service_providers(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES scheduling.service_types(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_appointment_time CHECK (start_time < end_time)
);

-- Enable Row Level Security
ALTER TABLE scheduling.appointments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Clients can view their own appointments"
    ON scheduling.appointments FOR SELECT
    USING (auth.uid() = client_id);

CREATE POLICY "Providers can view their appointments"
    ON scheduling.appointments FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM scheduling.service_providers sp
        WHERE sp.id = provider_id
        AND sp.user_id = auth.uid()
    ));

CREATE POLICY "Clients can create appointments"
    ON scheduling.appointments FOR INSERT
    WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Providers can manage their appointments"
    ON scheduling.appointments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM scheduling.service_providers sp
        WHERE sp.id = provider_id
        AND sp.user_id = auth.uid()
    )); 