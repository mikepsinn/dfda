-- Aggregate User Variable Relationships View
--
-- Aggregates statistics about relationships between variables from user data,
-- including correlation coefficients, user votes, and confidence scores
--
CREATE MATERIALIZED VIEW aggregate.aggregate_user_variable_relationships AS
WITH relationship_stats AS (
    SELECT 
        r.predictor_variable_id,
        r.outcome_variable_id,
        COUNT(DISTINCT r.user_id) as number_of_users,
        AVG(r.correlation_coefficient) as average_correlation,
        AVG(r.confidence_score) as average_confidence,
        SUM(CASE WHEN r.user_vote = 1 THEN 1 ELSE 0 END) as positive_votes,
        SUM(CASE WHEN r.user_vote = -1 THEN 1 ELSE 0 END) as negative_votes,
        SUM(CASE WHEN r.user_vote = 0 THEN 1 ELSE 0 END) as neutral_votes
    FROM personal.user_variable_relationships r
    WHERE r.deleted_at IS NULL
    GROUP BY r.predictor_variable_id, r.outcome_variable_id
)
SELECT 
    rs.*,
    p.name as predictor_name,
    p.display_name as predictor_display_name,
    o.name as outcome_name,
    o.display_name as outcome_display_name,
    (rs.positive_votes - rs.negative_votes)::float / NULLIF(rs.positive_votes + rs.negative_votes, 0) as vote_ratio,
    NOW() as last_updated
FROM relationship_stats rs
JOIN reference.global_variables p ON rs.predictor_variable_id = p.id
JOIN reference.global_variables o ON rs.outcome_variable_id = o.id;

-- Create indexes for better query performance
CREATE UNIQUE INDEX idx_aggregate_user_variable_relationships_vars 
ON aggregate.aggregate_user_variable_relationships(predictor_variable_id, outcome_variable_id);

CREATE INDEX idx_aggregate_user_variable_relationships_predictor
ON aggregate.aggregate_user_variable_relationships(predictor_variable_id);

CREATE INDEX idx_aggregate_user_variable_relationships_outcome
ON aggregate.aggregate_user_variable_relationships(outcome_variable_id);

-- Add comments
COMMENT ON MATERIALIZED VIEW aggregate.aggregate_user_variable_relationships IS 
'Aggregated statistics about relationships between variables from user data, including correlations and user votes';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION aggregate.refresh_aggregate_user_variable_relationships()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY aggregate.aggregate_user_variable_relationships;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh the view when relationships are modified
CREATE TRIGGER refresh_aggregate_user_variable_relationships
AFTER INSERT OR UPDATE OR DELETE ON personal.user_variable_relationships
FOR EACH STATEMENT EXECUTE FUNCTION aggregate.refresh_aggregate_user_variable_relationships(); 