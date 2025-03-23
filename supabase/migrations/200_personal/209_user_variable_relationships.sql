-- User Variable Relationships
--
-- User-specific relationships between variables
-- Stores individual correlation data and settings
--
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

-- Index for faster lookups
CREATE INDEX ON personal.user_variable_relationships(user_id);
CREATE INDEX ON personal.user_variable_relationships(predictor_variable_id);
CREATE INDEX ON personal.user_variable_relationships(outcome_variable_id);

-- Enable row level security
ALTER TABLE personal.user_variable_relationships ENABLE ROW LEVEL SECURITY;

-- Policies for different user roles
CREATE POLICY "Users can view own relationships" ON personal.user_variable_relationships
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own relationships" ON personal.user_variable_relationships
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own relationships" ON personal.user_variable_relationships
    FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_variable_relationships_updated_at
    BEFORE UPDATE ON personal.user_variable_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE personal.user_variable_relationships IS 'Stores user-specific relationships between variables based on personal tracking and analysis';
COMMENT ON COLUMN personal.user_variable_relationships.predictor_variable_id IS 'The variable being tracked as a potential predictor';
COMMENT ON COLUMN personal.user_variable_relationships.outcome_variable_id IS 'The variable being analyzed for potential correlation with the predictor';
COMMENT ON COLUMN personal.user_variable_relationships.onset_delay IS 'Time delay before predictor shows correlation with outcome';
COMMENT ON COLUMN personal.user_variable_relationships.duration_of_action IS 'Duration of correlation between predictor and outcome';
COMMENT ON COLUMN personal.user_variable_relationships.correlation_coefficient IS 'Statistical correlation between predictor and outcome variables';
COMMENT ON COLUMN personal.user_variable_relationships.confidence_level IS 'Statistical confidence level in the correlation';
COMMENT ON COLUMN personal.user_variable_relationships.confidence_score IS 'Overall confidence score considering multiple factors';
COMMENT ON COLUMN personal.user_variable_relationships.user_vote IS 'User feedback on the relationship (-1: disagree, 0: neutral, 1: agree)'; 