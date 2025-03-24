-- Provider Services
CREATE TABLE scheduling.provider_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES scheduling.service_providers(id) ON DELETE CASCADE,
    service_type_id UUID NOT NULL REFERENCES scheduling.service_types(id) ON DELETE CASCADE,
    price DECIMAL CHECK (price >= 0),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, service_type_id)
);

-- Enable Row Level Security
ALTER TABLE scheduling.provider_services ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Active provider services are viewable by all"
    ON scheduling.provider_services FOR SELECT
    USING (is_active = true);

CREATE POLICY "Providers can manage their own services"
    ON scheduling.provider_services FOR ALL
    USING (EXISTS (
        SELECT 1 FROM scheduling.service_providers sp
        WHERE sp.id = provider_id
        AND sp.user_id = auth.uid()
    )); 