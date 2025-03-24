-- Table: reference.data_quality_rules

CREATE TABLE reference.data_quality_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    validation_function TEXT,
    error_message TEXT,
    severity VARCHAR(20) DEFAULT 'ERROR',
    applies_to_table VARCHAR(100),
    applies_to_column VARCHAR(100),
    parameters JSONB,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
