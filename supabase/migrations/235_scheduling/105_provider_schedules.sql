-- Provider Schedules
CREATE TABLE scheduling.provider_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES scheduling.service_providers(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

-- Enable Row Level Security
ALTER TABLE scheduling.provider_schedules ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Provider schedules are viewable by all"
    ON scheduling.provider_schedules FOR SELECT
    USING (is_available = true);

CREATE POLICY "Providers can manage their own schedules"
    ON scheduling.provider_schedules FOR ALL
    USING (EXISTS (
        SELECT 1 FROM scheduling.service_providers sp
        WHERE sp.id = provider_id
        AND sp.user_id = auth.uid()
    )); 