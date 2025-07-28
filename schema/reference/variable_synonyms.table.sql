-- Table: reference.variable_synonyms

CREATE TABLE reference.variable_synonyms (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    variable_id bigint NOT NULL REFERENCES reference.variables(id),
    name text NOT NULL,                -- Alternative name or translation
    language_code text NOT NULL DEFAULT 'en',  -- ISO 639-1 language code
    source_type text NOT NULL CHECK (source_type IN ('reference', 'user', 'expert', 'aggregate')),
    source_id bigint,                    -- ID of the user/expert who contributed this
    confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(variable_id, name, language_code)
);
