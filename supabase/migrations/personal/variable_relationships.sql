-- Variable Relationships
--
-- Tracks relationships between variables for each user, including correlations,
-- predictive relationships, and causal inferences
--
CREATE TABLE personal.variable_relationships (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES core.profiles(id),
    cause_variable_id INTEGER NOT NULL REFERENCES reference.variables(id),
    effect_variable_id INTEGER NOT NULL REFERENCES reference.variables(id),
    relationship_type TEXT NOT NULL CHECK (relationship_type IN ('correlation', 'prediction', 'causation')),
    relationship_strength DOUBLE PRECISION,
    confidence_level DOUBLE PRECISION,
    lag_in_seconds INTEGER,
    onset_delay INTERVAL,
    duration_of_action INTERVAL,
    number_of_pairs INTEGER,
    p_value DOUBLE PRECISION,
    t_value DOUBLE PRECISION,
    critical_t_value DOUBLE PRECISION,
    confidence_interval_min DOUBLE PRECISION,
    confidence_interval_max DOUBLE PRECISION,
    statistical_significance BOOLEAN,
    cause_changes DOUBLE PRECISION,
    effect_changes DOUBLE PRECISION,
    qm_score DOUBLE PRECISION COMMENT 'Quality of data and relationship (0-100)',
    predictor_error DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'failed')),
    error_message TEXT,
    analysis_parameters JSONB,
    analysis_version TEXT,
    UNIQUE(user_id, cause_variable_id, effect_variable_id)
);

-- Create indexes
CREATE INDEX idx_variable_relationships_user ON personal.variable_relationships(user_id);
CREATE INDEX idx_variable_relationships_cause ON personal.variable_relationships(cause_variable_id);
CREATE INDEX idx_variable_relationships_effect ON personal.variable_relationships(effect_variable_id);
CREATE INDEX idx_variable_relationships_strength ON personal.variable_relationships(relationship_strength DESC);
CREATE INDEX idx_variable_relationships_qm_score ON personal.variable_relationships(qm_score DESC);

-- Enable RLS
ALTER TABLE personal.variable_relationships ENABLE ROW LEVEL SECURITY;

-- Add comments
COMMENT ON TABLE personal.variable_relationships IS 'Tracks relationships between variables for each user, including correlations, predictions, and causal inferences';

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON personal.variable_relationships
    FOR EACH ROW
    EXECUTE FUNCTION common.set_updated_at(); 