-- Variable Statistics View
--
-- Calculated statistics and metrics for variables
-- This view contains derived/computed values that are calculated from other tables
--

CREATE VIEW reference.variable_stats AS
SELECT 
    v.id,
    v.name,
    -- Statistical measures
    v.kurtosis,
    v.maximum_recorded_value,
    v.mean,
    v.median,
    v.minimum_recorded_value,
    v.most_common_value,
    v.number_of_unique_values,
    v.second_most_common_value,
    v.skewness,
    v.standard_deviation,
    v.third_most_common_value,
    v.variance,
    
    -- Correlation counts
    v.number_of_aggregate_correlations_as_cause,
    v.number_of_aggregate_correlations_as_effect,
    
    -- Measurement statistics
    v.number_of_measurements,
    v.number_of_soft_deleted_measurements,
    v.average_seconds_between_measurements,
    v.median_seconds_between_measurements,
    v.number_of_raw_measurements_with_tags_joins_children,
    
    -- Measurement timestamps
    v.newest_data_at,
    v.latest_tagged_measurement_start_at,
    v.earliest_tagged_measurement_start_at,
    v.latest_non_tagged_measurement_start_at,
    v.earliest_non_tagged_measurement_start_at,
    
    -- Analysis status and timing
    v.analysis_settings_modified_at,
    v.analysis_requested_at,
    v.analysis_started_at,
    v.analysis_ended_at,
    v.reason_for_analysis,
    v.user_error_message,
    v.internal_error_message,
    
    -- Study counts
    v.number_of_outcome_population_studies,
    v.number_of_predictor_population_studies,
    v.number_of_outcome_case_studies,
    v.number_of_predictor_case_studies,
    v.number_of_studies_where_cause_variable,
    v.number_of_studies_where_effect_variable,
    
    -- Application counts
    v.number_of_applications_where_outcome_variable,
    v.number_of_applications_where_predictor_variable,
    
    -- Tag counts
    v.number_common_tagged_by,
    v.number_of_common_tags,
    v.number_of_common_tags_where_tag_variable,
    v.number_of_common_tags_where_tagged_variable,
    v.number_of_user_tags_where_tag_variable,
    v.number_of_user_tags_where_tagged_variable,
    
    -- Variable relationships
    v.number_of_common_joined_variables,
    v.number_of_common_ingredients,
    v.number_of_common_foods,
    v.number_of_common_children,
    v.number_of_common_parents,
    v.number_of_user_joined_variables,
    v.number_of_user_ingredients,
    v.number_of_user_foods,
    v.number_of_user_children,
    v.number_of_user_parents,
    v.number_of_variables_where_best_cause_variable,
    v.number_of_variables_where_best_effect_variable,
    
    -- Other counts
    v.number_of_tracking_reminders,
    v.number_of_tracking_reminder_notifications,
    v.number_of_votes_where_cause_variable,
    v.number_of_votes_where_effect_variable,
    v.number_of_users_where_primary_outcome_variable,
    
    -- Record metadata
    v.record_size_in_kb
FROM 
    reference.variables v;

-- Add view comments
COMMENT ON VIEW reference.variable_stats IS 'Calculated statistics and metrics for variables, including correlations, measurements, studies, and relationships'; 