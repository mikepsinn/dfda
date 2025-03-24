-- Seed: reference.variable_categories
-- Seed data for reference.variable_categories

INSERT INTO reference.variable_categories 
(id, name, name_singular, description, synonyms, sort_order, is_public, boring, default_unit_id, minimum_allowed_value, maximum_allowed_value, 
minimum_allowed_seconds_between_measurements, filling_value, filling_type, duration_of_action, onset_delay, combination_operation, 
manual_tracking, valence, is_goal, controllable, cause_only, effect_only, predictor, outcome) VALUES
(1, 'Emotions', 'Emotion', NULL, '["Emotions","Emotion","Mood"]', 0, true, false, 10, NULL, NULL, 60, -1, 'none', 86400, 0, 'mean', true, 'neutral', 'never', 'never', false, NULL, false, true),
(2, 'Physique', '', NULL, '', 0, true, false, NULL, NULL, NULL, 86400, -1, 'none', 604800, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, true),
(3, 'Physical Activity', '', NULL, '["Physical Activity","Physical Activities"]', 0, true, false, NULL, NULL, NULL, 3600, 0, 'zero', 86400, 0, 'sum', false, 'positive', 'never', 'never', false, NULL, true, true),
(4, 'Locations', '', NULL, '["Location","Locations"]', 0, false, true, 2, NULL, NULL, 600, 0, 'zero', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, false),
(5, 'Miscellaneous', '', NULL, '["Miscellaneous","Uncategorized"]', 0, false, true, NULL, NULL, NULL, NULL, -1, NULL, 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, true),
(6, 'Sleep', '', NULL, '', 0, true, false, NULL, NULL, NULL, 86400, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, true),
(7, 'Social Interactions', '', NULL, '["Social Interactions","Social Interaction"]', 0, false, false, NULL, NULL, NULL, 60, 0, 'zero', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, true),
(8, 'Vital Signs', '', NULL, '["Vital Signs","Vital Sign"]', 0, true, false, NULL, NULL, NULL, NULL, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, true),
(9, 'Cognitive Performance', '', NULL, '', 0, true, false, NULL, NULL, NULL, NULL, -1, 'none', 86400, 0, 'mean', true, 'positive', 'never', 'never', false, NULL, false, true),
(10, 'Symptoms', '', NULL, '["Symptoms","Symptom"]', 0, true, false, 10, NULL, NULL, 60, -1, 'none', 86400, 0, 'mean', true, 'negative', 'never', 'never', false, NULL, true, true),
(11, 'Nutrients', '', NULL, '["Nutrients","Nutrient"]', 0, true, false, 6, NULL, NULL, NULL, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', true, NULL, true, false),
(12, 'Goals', '', NULL, '["Work","Productivity","Goals","Goal"]', 0, false, false, NULL, NULL, NULL, 60, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, false, true),
(13, 'Treatments', '', NULL, '["Health and Beauty","Health & Beauty","Treatments","Treatment","HealthPersonalCare","Baby Product","Home"]', 0, true, false, 23, 0, NULL, 60, 0, 'zero', 86400, 1800, 'sum', true, 'positive', 'never', 'never', true, NULL, true, false),
(14, 'Activities', 'Activity', NULL, '["Activities","Activity"]', 0, false, false, 2, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'sum', false, '', 'never', 'never', false, NULL, true, NULL),
(15, 'Foods', '', NULL, '["Grocery","Foods","Food","GourmetFood"]', 0, true, false, 44, 0, NULL, NULL, 0, 'zero', 864000, 1800, 'sum', true, 'positive', 'never', 'never', true, NULL, true, false),
(16, 'Conditions', '', NULL, '["Conditions","Condition"]', 0, true, false, NULL, NULL, NULL, NULL, -1, NULL, 86400, 0, 'mean', true, 'positive', 'never', 'never', false, NULL, false, true),
(17, 'Environment', '', NULL, '', 0, true, false, NULL, NULL, NULL, 86400, NULL, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', true, NULL, true, false),
(18, 'Causes of Illness', '', NULL, '["Causes of Illness","Cause of Illness"]', 0, true, false, NULL, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, false),
(19, 'Books', '', NULL, '["Books","Book"]', 0, true, true, NULL, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, NULL, true, false),
(20, 'Software', '', NULL, '["Software & Mobile Apps","App","Software","Software & Mobile App","Software Usage"]', 0, false, true, 2, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'sum', false, 'positive', 'never', 'never', false, NULL, true, false),
(32, 'Payments', '', NULL, '["Purchases","Payments","Payment","Purchase"]', 0, false, true, 49, NULL, NULL, NULL, 0, 'zero', 2592000, 0, 'sum', false, 'positive', 'never', 'never', false, NULL, true, false),
(42, 'Movies and TV', '', NULL, '', 0, true, true, NULL, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'sum', false, 'positive', 'never', 'never', false, NULL, true, false),
(251, 'Music', '', NULL, '', 0, true, true, 23, NULL, NULL, NULL, 0, 'zero', 86400, 0, 'sum', false, 'positive', 'never', 'never', false, NULL, true, false),
(252, 'Electronics', '', NULL, '["Electronics","Electronic"]', 0, true, true, 23, 0, NULL, NULL, 0, 'zero', 604800, 1800, 'sum', false, 'positive', 'never', 'never', true, NULL, true, false),
(253, 'IT Metrics', '', NULL, '', 0, false, true, 23, NULL, NULL, NULL, -1, 'none', 86400, 0, 'sum', false, 'positive', 'never', 'never', false, false, true, false),
(254, 'Economic Indicators', '', NULL, '["Economic Data","Economic Indicators"]', 0, true, true, 15, NULL, NULL, NULL, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, false, true, true),
(255, 'Investment Strategies', '', NULL, '["Investment Strategy","Investment Strategies"]', 0, true, true, 21, NULL, NULL, NULL, -1, 'none', 86400, 0, 'mean', false, 'positive', 'never', 'never', false, false, true, true);
