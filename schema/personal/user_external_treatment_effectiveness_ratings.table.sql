-- Table: personal.user_external_treatment_effectiveness_ratings

CREATE TABLE personal.user_external_treatment_effectiveness_ratings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    treatment_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    condition_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    source_type text NOT NULL CHECK (source_type IN ('doctor', 'research', 'anecdotal')),
    source_name text,
    source_url text,
    effectiveness_rating text CHECK (effectiveness_rating IN ('much_worse', 'worse', 'no_effect', 'better', 'much_better')),
    side_effects_rating text CHECK (side_effects_rating IN ('none', 'mild', 'moderate', 'severe', 'intolerable')),
    confidence_level text CHECK (confidence_level IN ('low', 'medium', 'high')),
    notes text,
    is_public boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, treatment_variable_id, condition_variable_id, source_type, source_name)
);
