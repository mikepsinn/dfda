-- Schedule Exceptions
CREATE TABLE scheduling.schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES scheduling.service_providers(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT FALSE,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_exception_time CHECK (
        (start_time IS NULL AND end_time IS NULL) OR
        (start_time IS NOT NULL AND end_time IS NOT NULL AND start_time < end_time)
    )
);

-- Enable Row Level Security
ALTER TABLE scheduling.schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Schedule exceptions are viewable by all"
    ON scheduling.schedule_exceptions FOR SELECT
    USING (TRUE);

CREATE POLICY "Providers can manage their own exceptions"
    ON scheduling.schedule_exceptions FOR ALL
    USING (EXISTS (
        SELECT 1 FROM scheduling.service_providers sp
        WHERE sp.id = provider_id
        AND sp.user_id = auth.uid()
    )); 