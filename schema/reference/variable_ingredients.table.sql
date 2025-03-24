-- Table: reference.variable_ingredients

CREATE TABLE reference.variable_ingredients (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parent_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    ingredient_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    amount numeric,                    -- Specific amount of the ingredient
    unit_id VARCHAR(50) REFERENCES reference.units_of_measurement(id) ON DELETE RESTRICT,
    proportion DECIMAL,                -- Alternative to amount/unit for relative proportions
    is_active_ingredient BOOLEAN DEFAULT FALSE,  -- Particularly relevant for medications
    version_number INTEGER NOT NULL DEFAULT 1,   -- For tracking formulation changes
    source_type text NOT NULL CHECK (source_type IN ('reference', 'user', 'expert', 'aggregate')),
    source_id bigint,                    -- ID of the user/expert who contributed this
    confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(parent_variable_id, ingredient_variable_id, version_number, source_type),
    CONSTRAINT no_self_reference CHECK (parent_variable_id != ingredient_variable_id)
);
