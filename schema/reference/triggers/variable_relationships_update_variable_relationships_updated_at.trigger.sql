-- Trigger: reference.variable_relationships_update_variable_relationships_updated_at
-- Original name: update_variable_relationships_updated_at

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
