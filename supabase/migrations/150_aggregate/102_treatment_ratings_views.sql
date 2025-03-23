-- Treatment Ratings Views
--
-- This file contains two views for treatment ratings:
-- 1. combined_treatment_ratings: Combines raw ratings from user and external sources
-- 2. aggregated_treatment_ratings: Provides statistical aggregations of those ratings
--

-- Combined Treatment Ratings View
--
-- Combines user-reported and external treatment effectiveness ratings
-- into a single view for easier querying and analysis
--
CREATE VIEW aggregate.combined_treatment_ratings AS
WITH user_ratings AS (
    SELECT 
        user_id,
        treatment_variable_id,
        condition_variable_id,
        effectiveness_rating,
        side_effects_rating,
        adherence_rating,
        cost_rating,
        notes as review_text,
        created_at,
        updated_at,
        'user' as rating_source
    FROM personal.user_treatment_effectiveness_ratings
    WHERE deleted_at IS NULL
),
external_ratings AS (
    SELECT 
        user_id,
        treatment_variable_id,
        condition_variable_id,
        effectiveness_rating,
        side_effects_rating,
        NULL as adherence_rating,
        NULL as cost_rating,
        notes as review_text,
        created_at,
        updated_at,
        source_type as rating_source
    FROM personal.user_external_treatment_effectiveness_ratings
    WHERE deleted_at IS NULL
)
SELECT * FROM user_ratings
UNION ALL
SELECT * FROM external_ratings;

-- Aggregated Treatment Ratings View
--
-- Aggregates treatment effectiveness ratings statistics from both user reports
-- and external sources, providing summary metrics for analysis
--
CREATE MATERIALIZED VIEW aggregate.aggregated_treatment_ratings AS
WITH user_ratings AS (
    SELECT 
        treatment_variable_id,
        condition_variable_id,
        effectiveness_rating,
        side_effects_rating,
        adherence_rating,
        cost_rating,
        COUNT(*) as rating_count,
        COUNT(*) FILTER (WHERE is_public) as public_rating_count
    FROM personal.user_treatment_effectiveness_ratings
    WHERE deleted_at IS NULL
    GROUP BY 
        treatment_variable_id,
        condition_variable_id,
        effectiveness_rating,
        side_effects_rating,
        adherence_rating,
        cost_rating
),
external_ratings AS (
    SELECT 
        treatment_variable_id,
        condition_variable_id,
        effectiveness_rating,
        side_effects_rating,
        confidence_level,
        source_type,
        COUNT(*) as rating_count
    FROM personal.user_external_treatment_effectiveness_ratings
    WHERE deleted_at IS NULL
    GROUP BY 
        treatment_variable_id,
        condition_variable_id,
        effectiveness_rating,
        side_effects_rating,
        confidence_level,
        source_type
)
SELECT 
    treatment_variable_id,
    condition_variable_id,
    'user' as rating_source,
    effectiveness_rating,
    side_effects_rating,
    NULL as confidence_level,
    rating_count,
    public_rating_count
FROM user_ratings

UNION ALL

SELECT 
    treatment_variable_id,
    condition_variable_id,
    source_type as rating_source,
    effectiveness_rating,
    side_effects_rating,
    confidence_level,
    rating_count,
    rating_count as public_rating_count
FROM external_ratings;

-- Create indexes for better query performance
CREATE INDEX idx_agg_treatment_ratings_treatment 
ON aggregate.aggregated_treatment_ratings(treatment_variable_id);

CREATE INDEX idx_agg_treatment_ratings_condition
ON aggregate.aggregated_treatment_ratings(condition_variable_id);

-- Add comments
COMMENT ON VIEW aggregate.combined_treatment_ratings IS 
'Combined view of raw treatment effectiveness ratings from both user reports and external sources';

COMMENT ON MATERIALIZED VIEW aggregate.aggregated_treatment_ratings IS 
'Aggregated view of treatment effectiveness ratings statistics from both user reports and external sources';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION aggregate.refresh_aggregated_treatment_ratings()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY aggregate.aggregated_treatment_ratings;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh the view when ratings are modified
CREATE TRIGGER refresh_agg_ratings_user
AFTER INSERT OR UPDATE OR DELETE ON personal.user_treatment_effectiveness_ratings
FOR EACH STATEMENT EXECUTE FUNCTION aggregate.refresh_aggregated_treatment_ratings();

CREATE TRIGGER refresh_agg_ratings_external
AFTER INSERT OR UPDATE OR DELETE ON personal.user_external_treatment_effectiveness_ratings
FOR EACH STATEMENT EXECUTE FUNCTION aggregate.refresh_aggregated_treatment_ratings(); 