-- Trigger: personal.user_variable_relationships_update_user_variable_relationships_updated_at
-- Original name: update_user_variable_relationships_updated_at

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
