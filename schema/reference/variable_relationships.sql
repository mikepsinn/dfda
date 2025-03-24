-- Variable relationships table storing known or hypothesized relationships between variables
-- from various sources (research papers, expert knowledge, aggregate analysis)
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

-- Index for faster lookups
CREATE INDEX ON reference.variable_relationships(predictor_variable_id);
CREATE INDEX ON reference.variable_relationships(outcome_variable_id);

-- Enable row level security
ALTER TABLE reference.variable_relationships ENABLE ROW LEVEL SECURITY;

-- Policies for different user roles
CREATE POLICY "Allow public read access" ON reference.variable_relationships
    FOR SELECT USING (true);

CREATE POLICY "Allow experts to insert" ON reference.variable_relationships
    FOR INSERT WITH CHECK (
        auth.jwt() ->> 'role' = 'expert'
        AND source_type = 'expert'
        AND source_id::text = (auth.jwt() ->> 'sub')
    );

CREATE POLICY "Allow experts to update own" ON reference.variable_relationships
    FOR UPDATE USING (
        auth.jwt() ->> 'role' = 'expert'
        AND source_type = 'expert'
        AND source_id::text = (auth.jwt() ->> 'sub')
    );

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_variable_relationships_updated_at
    BEFORE UPDATE ON reference.variable_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE reference.variable_relationships IS 'Stores relationships between variables from various sources including research, expert knowledge, and aggregate analysis.';
COMMENT ON COLUMN reference.variable_relationships.predictor_variable_id IS 'The variable that may predict or influence the outcome variable';
COMMENT ON COLUMN reference.variable_relationships.outcome_variable_id IS 'The variable that may be predicted or influenced by the predictor variable';
COMMENT ON COLUMN reference.variable_relationships.relationship_type IS 'The type of relationship (predicts, treats, prevents, etc.)';
COMMENT ON COLUMN reference.variable_relationships.confidence_score IS 'Score between 0-1 indicating confidence in this relationship based on evidence quality';
COMMENT ON COLUMN reference.variable_relationships.onset_delay IS 'Expected time delay before the predictor variable shows correlation with the outcome';
COMMENT ON COLUMN reference.variable_relationships.duration_of_action IS 'Expected duration of correlation between predictor and outcome'; 