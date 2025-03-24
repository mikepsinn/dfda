-- Variable Global Statistics View
--
-- Aggregates variable statistics across users who have opted to share their data
-- via OAuth2 clients for the Decentralized FDA platform
--
CREATE MATERIALIZED VIEW global.variable_global_stats AS
WITH authorized_users AS (
    -- Get users who have authorized data sharing via OAuth2
    SELECT DISTINCT up.user_id
    FROM oauth2.clients c
    JOIN oauth2.user_permissions up ON c.id = up.client_id
    WHERE c.is_active = true 
    AND up.scope LIKE '%read_measurements%'
    AND up.revoked_at IS NULL
),
shared_stats AS (
    -- Get stats only from users who have authorized sharing
    SELECT 
        uvs.variable_id,
        COUNT(DISTINCT uvs.user_id) as number_of_users,
        COUNT(*) as number_of_measurements,
        MIN(uvs.minimum_recorded_value) as global_minimum_value,
        MAX(uvs.maximum_recorded_value) as global_maximum_value,
        AVG(uvs.average_value) as average_value_across_users,
        STDDEV(uvs.average_value) as std_dev_between_users,
        AVG(uvs.standard_deviation) as avg_std_dev_within_users,
        MIN(uvs.earliest_measurement) as earliest_measurement,
        MAX(uvs.latest_measurement) as latest_measurement,
        AVG(uvs.number_of_days_with_measurements) as avg_days_with_measurements,
        -- Statistical aggregates
        AVG(CASE WHEN uvs.standard_deviation > 0 THEN uvs.standard_deviation END) as mean_standard_deviation,
        PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY uvs.average_value) as percentile_25,
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY uvs.average_value) as median_value,
        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY uvs.average_value) as percentile_75
    FROM personal.user_variable_stats uvs
    JOIN authorized_users au ON uvs.user_id = au.user_id
    WHERE uvs.number_of_measurements > 0
    GROUP BY uvs.variable_id
),
relationship_stats AS (
    -- Aggregate relationship statistics
    SELECT 
        v.id as variable_id,
        COUNT(DISTINCT CASE WHEN vr.cause_variable_id = v.id THEN vr.id END) as number_of_relationships_as_cause,
        COUNT(DISTINCT CASE WHEN vr.effect_variable_id = v.id THEN vr.id END) as number_of_relationships_as_effect,
        AVG(CASE WHEN vr.cause_variable_id = v.id THEN vr.relationship_strength END) as avg_relationship_strength_as_cause,
        AVG(CASE WHEN vr.effect_variable_id = v.id THEN vr.relationship_strength END) as avg_relationship_strength_as_effect,
        AVG(CASE WHEN vr.cause_variable_id = v.id THEN vr.qm_score END) as avg_qm_score_as_cause,
        AVG(CASE WHEN vr.effect_variable_id = v.id THEN vr.qm_score END) as avg_qm_score_as_effect,
        COUNT(DISTINCT CASE WHEN vr.cause_variable_id = v.id AND vr.relationship_type = 'causation' THEN vr.id END) as number_of_causal_relationships_as_cause,
        COUNT(DISTINCT CASE WHEN vr.effect_variable_id = v.id AND vr.relationship_type = 'causation' THEN vr.id END) as number_of_causal_relationships_as_effect
    FROM reference.variables v
    LEFT JOIN personal.variable_relationships vr ON (v.id = vr.cause_variable_id OR v.id = vr.effect_variable_id)
    JOIN authorized_users au ON vr.user_id = au.user_id
    WHERE vr.status = 'completed'
    AND vr.deleted_at IS NULL
    GROUP BY v.id
)
SELECT 
    v.id as variable_id,
    v.name,
    v.variable_category_id,
    v.default_unit_id,
    v.combination_operation,
    v.filling_type,
    -- User stats
    COALESCE(ss.number_of_users, 0) as number_of_users,
    COALESCE(ss.number_of_measurements, 0) as total_measurements,
    -- Value statistics
    ss.global_minimum_value,
    ss.global_maximum_value,
    ss.average_value_across_users,
    ss.std_dev_between_users,
    ss.avg_std_dev_within_users,
    ss.mean_standard_deviation,
    ss.percentile_25,
    ss.median_value,
    ss.percentile_75,
    -- Temporal stats
    ss.earliest_measurement,
    ss.latest_measurement,
    ss.avg_days_with_measurements,
    -- Relationship stats
    rs.number_of_relationships_as_cause,
    rs.number_of_relationships_as_effect,
    rs.avg_relationship_strength_as_cause,
    rs.avg_relationship_strength_as_effect,
    rs.avg_qm_score_as_cause,
    rs.avg_qm_score_as_effect,
    rs.number_of_causal_relationships_as_cause,
    rs.number_of_causal_relationships_as_effect,
    -- Metadata
    NOW() as last_updated
FROM reference.variables v
LEFT JOIN shared_stats ss ON v.id = ss.variable_id
LEFT JOIN relationship_stats rs ON v.id = rs.variable_id
WHERE v.deleted_at IS NULL;

-- Create indexes for better query performance
CREATE UNIQUE INDEX idx_variable_global_stats_id
ON global.variable_global_stats(variable_id);

CREATE INDEX idx_variable_global_stats_category
ON global.variable_global_stats(variable_category_id);

CREATE INDEX idx_variable_global_stats_measurements
ON global.variable_global_stats(total_measurements DESC);

-- Add comments
COMMENT ON MATERIALIZED VIEW global.variable_global_stats IS 
'Aggregated variable statistics from users who have opted to share their data via OAuth2 clients for the Decentralized FDA platform';

-- Create function to refresh the materialized view
CREATE OR REPLACE FUNCTION global.refresh_variable_global_stats()
RETURNS trigger AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY global.variable_global_stats;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to refresh when underlying data changes
CREATE TRIGGER refresh_variable_global_stats_measurements
AFTER INSERT OR UPDATE OR DELETE ON personal.user_variable_stats
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

CREATE TRIGGER refresh_variable_global_stats_variables
AFTER INSERT OR UPDATE OR DELETE ON reference.variables
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

CREATE TRIGGER refresh_variable_global_stats_oauth
AFTER INSERT OR UPDATE OR DELETE ON oauth2.user_permissions
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats();

CREATE TRIGGER refresh_variable_global_stats_relationships
AFTER INSERT OR UPDATE OR DELETE ON personal.variable_relationships
FOR EACH STATEMENT EXECUTE FUNCTION global.refresh_variable_global_stats(); 