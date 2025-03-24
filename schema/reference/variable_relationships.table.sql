-- Table: reference.variable_relationships

CREATE TABLE reference.variable_relationships (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    predictor_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    outcome_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    relationship_type text NOT NULL CHECK (relationship_type IN (
        'predicts', 'may_predict', 'treats', 'may_treat',
        'prevents', 'may_prevent', 'increases_risk_of', 'decreases_risk_of'
    )),
    source_type text NOT NULL CHECK (source_type IN ('reference', 'user', 'expert', 'aggregate')),
    source_id bigint, -- ID of the user, expert, or reference that provided this relationship
    confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
    correlation_coefficient float,
    p_value float,
    number_of_studies integer,
    number_of_participants integer,
    onset_delay interval, -- Time until the predictor's effect on the outcome begins
    duration_of_action interval, -- How long the predictor's effect on the outcome lasts
    study_designs text[], -- Array of study types supporting this relationship
    references text[], -- Array of DOIs or URLs to supporting research
    notes text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(predictor_variable_id, outcome_variable_id)
);
