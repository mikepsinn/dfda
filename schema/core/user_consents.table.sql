-- Table: core.user_consents

CREATE TABLE core.user_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('data_collection', 'data_sharing', 'research_use', 'marketing', 'trial_participation')),
    protocol_id UUID, -- Will be referenced later
    consented BOOLEAN NOT NULL,
    consent_version TEXT NOT NULL,
    ip_address TEXT,
    consent_date TIMESTAMP WITH TIME ZONE NOT NULL,
    expiration_date TIMESTAMP WITH TIME ZONE,
    revocation_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    
    UNIQUE(user_id, consent_type, protocol_id, consent_version)
);
