-- Table: scheduling.provider_services

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
