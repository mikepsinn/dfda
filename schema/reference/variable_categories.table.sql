-- Table: reference.variable_categories

CREATE TABLE reference.variable_categories (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_singular VARCHAR(100),
    description TEXT,
    synonyms JSONB,  -- Changed from TEXT to JSONB
    slug VARCHAR(200) GENERATED ALWAYS AS (
        LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
    ) STORED,
    
    -- UI/Display
    sort_order INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    boring BOOLEAN DEFAULT false,
    
    -- Measurement constraints
    default_unit_id INTEGER REFERENCES reference.units_of_measurement(id) ON DELETE SET NULL,
    minimum_allowed_value DOUBLE PRECISION,
    maximum_allowed_value DOUBLE PRECISION,
    minimum_allowed_seconds_between_measurements INTEGER,
    filling_value DOUBLE PRECISION DEFAULT -1,
    filling_type filling_type_enum DEFAULT 'none',  -- Using existing enum
    
    -- Variable behavior
    duration_of_action INTEGER DEFAULT 86400,
    onset_delay INTEGER DEFAULT 0,
    combination_operation combination_operation_enum DEFAULT 'mean',
    
    -- Tracking settings
    manual_tracking BOOLEAN DEFAULT false,
    valence valence_type_enum DEFAULT 'neutral',
    is_goal frequency_type_enum DEFAULT 'never',
    controllable frequency_type_enum DEFAULT 'never',
    
    -- Relationship flags
    cause_only BOOLEAN DEFAULT false,
    effect_only BOOLEAN DEFAULT false,
    predictor BOOLEAN DEFAULT false,
    outcome BOOLEAN DEFAULT false,
    
    -- Timestamps
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
