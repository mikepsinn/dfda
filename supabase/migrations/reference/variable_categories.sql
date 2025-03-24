-- Variable Categories
--
-- Standard categories for classifying medical variables
-- These categories help organize and group different types of health measurements
--
CREATE TABLE reference.variable_categories (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    name_singular VARCHAR(100),
    description TEXT,
    synonyms TEXT,
    slug VARCHAR(200) GENERATED ALWAYS AS (
        LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))
    ) STORED,
    
    -- UI/Display
    sort_order INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT true,
    boring BOOLEAN DEFAULT false,
    
    -- Measurement constraints
    default_unit_id UUID REFERENCES reference.units_of_measurement(id),
    minimum_allowed_value DOUBLE PRECISION,
    maximum_allowed_value DOUBLE PRECISION,
    minimum_allowed_seconds_between_measurements INTEGER,
    filling_value DOUBLE PRECISION DEFAULT -1,
    filling_type VARCHAR(20) CHECK (filling_type IN ('ZERO', 'NONE', 'INTERPOLATION', 'VALUE')),
    
    -- Variable behavior
    duration_of_action INTEGER DEFAULT 86400,
    onset_delay INTEGER DEFAULT 0,
    combination_operation VARCHAR(10) CHECK (combination_operation IN ('SUM', 'MEAN')),
    
    -- Tracking settings
    manual_tracking BOOLEAN DEFAULT false,
    valence VARCHAR(10) CHECK (valence IN ('POSITIVE', 'NEGATIVE', 'NEUTRAL', '')),
    is_goal VARCHAR(10) CHECK (is_goal IN ('ALWAYS', 'SOMETIMES', 'NEVER', '')),
    controllable VARCHAR(10) CHECK (controllable IN ('ALWAYS', 'SOMETIMES', 'NEVER', '')),
    
    -- Relationship flags
    cause_only BOOLEAN DEFAULT false,
    effect_only BOOLEAN DEFAULT false,
    predictor BOOLEAN DEFAULT false,
    outcome BOOLEAN DEFAULT false,
    
    -- Timestamps
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default categories
INSERT INTO reference.variable_categories 
(id, name, name_singular, description, synonyms, sort_order, is_public, boring, default_unit_id, minimum_allowed_value, maximum_allowed_value, 
minimum_allowed_seconds_between_measurements, filling_value, filling_type, duration_of_action, onset_delay, combination_operation, 
manual_tracking, valence, is_goal, controllable, cause_only, effect_only, predictor, outcome) VALUES
(1, 'Emotions', 'Emotion', NULL, '["Emotions","Emotion","Mood"]', 0, true, false, 10, NULL, NULL, 60, -1, 'NONE', 86400, 0, 'MEAN', true, 'NEUTRAL', '', '', false, NULL, false, true),
(2, 'Physique', '', NULL, '', 0, true, false, NULL, NULL, NULL, 86400, -1, 'NONE', 604800, 0, 'MEAN', false, 'POSITIVE', '', '', false, NULL, true, true),
(3, 'Physical Activity', '', NULL, '["Physical Activity","Physical Activities"]', 0, true, false, NULL, NULL, NULL, 3600, 0, 'ZERO', 86400, 0, 'SUM', false, 'POSITIVE', '', '', false, NULL, true, true),
(4, 'Locations', '', NULL, '["Location","Locations"]', 0, false, true, 2, NULL, NULL, 600, 0, 'ZERO', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', false, NULL, true, false),
(5, 'Miscellaneous', '', NULL, '["Miscellaneous","Uncategorized"]', 0, false, true, NULL, NULL, NULL, NULL, -1, NULL, 86400, 0, 'MEAN', false, 'POSITIVE', '', '', false, NULL, true, true),
(6, 'Sleep', '', NULL, '', 0, true, false, NULL, NULL, NULL, 86400, -1, 'NONE', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', false, NULL, true, true),
(7, 'Social Interactions', '', NULL, '["Social Interactions","Social Interaction"]', 0, false, false, NULL, NULL, NULL, 60, 0, 'ZERO', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', false, NULL, true, true),
(8, 'Vital Signs', '', NULL, '["Vital Signs","Vital Sign"]', 0, true, false, NULL, NULL, NULL, NULL, -1, 'NONE', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', false, NULL, true, true),
(9, 'Cognitive Performance', '', NULL, '', 0, true, false, NULL, NULL, NULL, NULL, -1, 'NONE', 86400, 0, 'MEAN', true, 'POSITIVE', '', '', false, NULL, false, true),
(10, 'Symptoms', '', NULL, '["Symptoms","Symptom"]', 0, true, false, 10, NULL, NULL, 60, -1, 'NONE', 86400, 0, 'MEAN', true, 'NEGATIVE', '', '', false, NULL, true, true),
(11, 'Nutrients', '', NULL, '["Nutrients","Nutrient"]', 0, true, false, 6, NULL, NULL, NULL, -1, 'NONE', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', true, NULL, true, false),
(12, 'Goals', '', NULL, '["Work","Productivity","Goals","Goal"]', 0, false, false, NULL, NULL, NULL, 60, -1, 'NONE', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', false, NULL, false, true),
(13, 'Treatments', '', NULL, '["Health and Beauty","Health & Beauty","Treatments","Treatment","HealthPersonalCare","Baby Product","Home"]', 0, true, false, 23, 0, NULL, 60, 0, 'ZERO', 86400, 1800, 'SUM', true, 'POSITIVE', '', '', true, NULL, true, false),
(14, 'Activities', 'Activity', NULL, '["Activities","Activity"]', 0, false, false, 2, NULL, NULL, NULL, 0, 'ZERO', 86400, 0, 'SUM', false, '', '', '', false, NULL, true, NULL),
(15, 'Foods', '', NULL, '["Grocery","Foods","Food","GourmetFood"]', 0, true, false, 44, 0, NULL, NULL, 0, 'ZERO', 864000, 1800, 'SUM', true, 'POSITIVE', '', '', true, NULL, true, false),
(16, 'Conditions', '', NULL, '["Conditions","Condition"]', 0, true, false, NULL, NULL, NULL, NULL, -1, NULL, 86400, 0, 'MEAN', true, 'POSITIVE', '', '', false, NULL, false, true),
(17, 'Environment', '', NULL, '', 0, true, false, NULL, NULL, NULL, 86400, NULL, 'NONE', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', true, NULL, true, false),
(18, 'Causes of Illness', '', NULL, '["Causes of Illness","Cause of Illness"]', 0, true, false, NULL, NULL, NULL, NULL, 0, 'ZERO', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', false, NULL, true, false),
(19, 'Books', '', NULL, '["Books","Book"]', 0, true, true, NULL, NULL, NULL, NULL, 0, 'ZERO', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', false, NULL, true, false),
(20, 'Software', '', NULL, '["Software & Mobile Apps","App","Software","Software & Mobile App","Software Usage"]', 0, false, true, 2, NULL, NULL, NULL, 0, 'ZERO', 86400, 0, 'SUM', false, 'POSITIVE', '', '', false, NULL, true, false),
(32, 'Payments', '', NULL, '["Purchases","Payments","Payment","Purchase"]', 0, false, true, 49, NULL, NULL, NULL, 0, 'ZERO', 2592000, 0, 'SUM', false, 'POSITIVE', '', '', false, NULL, true, false),
(42, 'Movies and TV', '', NULL, '', 0, true, true, NULL, NULL, NULL, NULL, 0, 'ZERO', 86400, 0, 'SUM', false, 'POSITIVE', '', '', false, NULL, true, false),
(251, 'Music', '', NULL, '', 0, true, true, 23, NULL, NULL, NULL, 0, 'ZERO', 86400, 0, 'SUM', false, 'POSITIVE', '', '', false, NULL, true, false),
(252, 'Electronics', '', NULL, '["Electronics","Electronic"]', 0, true, true, 23, 0, NULL, NULL, 0, 'ZERO', 604800, 1800, 'SUM', false, 'POSITIVE', '', '', true, NULL, true, false),
(253, 'IT Metrics', '', NULL, '', 0, false, true, 23, NULL, NULL, NULL, -1, 'NONE', 86400, 0, 'SUM', false, 'POSITIVE', '', '', false, false, true, false),
(254, 'Economic Indicators', '', NULL, '["Economic Data","Economic Indicators"]', 0, true, true, 15, NULL, NULL, NULL, -1, 'NONE', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', false, false, true, true),
(255, 'Investment Strategies', '', NULL, '["Investment Strategy","Investment Strategies"]', 0, true, true, 21, NULL, NULL, NULL, -1, 'NONE', 86400, 0, 'MEAN', false, 'POSITIVE', '', '', false, false, true, true);

-- Enable Row Level Security
ALTER TABLE reference.variable_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Variable categories are viewable by all authenticated users"
    ON reference.variable_categories FOR SELECT
    USING (
        (is_public = true AND deleted_at IS NULL) OR 
        EXISTS (
            SELECT 1 FROM core.user_permissions up
            WHERE up.user_id = auth.uid()
            AND up.permission = 'view_medical'
        )
    );

CREATE POLICY "Admins can manage variable categories"
    ON reference.variable_categories FOR ALL
    USING (EXISTS (
        SELECT 1 FROM core.user_permissions up
        WHERE up.user_id = auth.uid()
        AND up.permission = 'manage_medical'
    )); 