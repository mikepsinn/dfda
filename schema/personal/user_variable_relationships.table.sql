-- Table: personal.user_variable_relationships

CREATE TABLE personal.user_variable_relationships (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    predictor_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    outcome_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    onset_delay interval, -- Time until predictor shows correlation with outcome
    duration_of_action interval, -- How long predictor correlates with outcome
    correlation_coefficient float,
    confidence_level float CHECK (confidence_level >= 0 AND confidence_level <= 1),
    confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
    user_vote integer CHECK (user_vote >= -1 AND user_vote <= 1),
    user_notes text,
    status text NOT NULL CHECK (status IN ('active', 'archived', 'deleted')) DEFAULT 'active',
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, predictor_variable_id, outcome_variable_id)
);
