-- Variables
--
-- Variable overviews with statistics, analysis settings, and data visualizations
-- and likely outcomes or predictors based on the anonymously aggregated donated data.
--

CREATE TABLE reference.variables (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(125) NOT NULL UNIQUE COMMENT 'User-defined variable display name',
    number_of_user_variables INTEGER DEFAULT 0 NOT NULL COMMENT 'Number of variables',
    variable_category_id INTEGER NOT NULL REFERENCES reference.variable_categories(id),
    default_unit_id INTEGER NOT NULL REFERENCES reference.units_of_measurement(id),
    default_value DOUBLE PRECISION,
    cause_only BOOLEAN COMMENT 'A value of true indicates that this variable is generally a cause in a causal relationship. An example would be Cloud Cover which would generally not be influenced by user behavior',
    client_id VARCHAR(80),
    combination_operation combination_operation_enum DEFAULT 'mean' COMMENT 'How to combine values of this variable (for instance, to see a summary of the values over a month)',
    common_alias VARCHAR(125),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description TEXT,
    duration_of_action INTEGER COMMENT 'How long the effect of a measurement in this variable lasts',
    filling_value DOUBLE PRECISION DEFAULT -1 COMMENT 'Value for replacing null measurements',
    image_url VARCHAR(2083),
    informational_url VARCHAR(2083),
    ion_icon VARCHAR(40),
    maximum_allowed_value DOUBLE PRECISION COMMENT 'Maximum reasonable value for a single measurement for this variable in the default unit',
    minimum_allowed_value DOUBLE PRECISION COMMENT 'Minimum reasonable value for this variable (uses default unit)',
    most_common_original_unit_id INTEGER COMMENT 'Most common Unit ID',
    onset_delay INTEGER COMMENT 'How long it takes for a measurement in this variable to take effect',
    outcome BOOLEAN COMMENT 'Outcome variables are those for which a human would generally want to identify influencing factors. These include symptoms, physique, mood, cognitive performance, etc.',
    parent_id INTEGER REFERENCES reference.variables(id) COMMENT 'ID of the parent variable if this variable has any parent',
    price DOUBLE PRECISION COMMENT 'Price',
    product_url VARCHAR(2083) COMMENT 'Product URL',
    status VARCHAR(25) DEFAULT 'WAITING' NOT NULL COMMENT 'status',
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    most_common_connector_id INTEGER,
    synonyms VARCHAR(600) COMMENT 'The primary variable name and any synonyms for it. This field should be used for non-specific variable searches.',
    wikipedia_url VARCHAR(2083),
    brand_name VARCHAR(125),
    valence valence_type_enum DEFAULT 'neutral',
    wikipedia_title VARCHAR(100),
    upc_12 VARCHAR(255),
    upc_14 VARCHAR(255),
    deleted_at TIMESTAMPTZ,
    most_common_source_name VARCHAR(255),
    data_sources_count TEXT COMMENT 'Array of connector or client measurement data source names as key with number of users as value',
    optimal_value_message VARCHAR(500),
    best_cause_variable_id INTEGER REFERENCES reference.variables(id),
    best_effect_variable_id INTEGER REFERENCES reference.variables(id),
    common_maximum_allowed_daily_value DOUBLE PRECISION,
    common_minimum_allowed_daily_value DOUBLE PRECISION,
    common_minimum_allowed_non_zero_value DOUBLE PRECISION,
    minimum_allowed_seconds_between_measurements INTEGER,
    additional_meta_data TEXT,
    manual_tracking BOOLEAN,
    wp_post_id BIGINT,
    charts JSONB,
    creator_user_id UUID NOT NULL REFERENCES core.profiles(id),
    best_aggregate_correlation_id INTEGER,
    filling_type filling_type_enum DEFAULT 'none',
    deletion_reason VARCHAR(280) COMMENT 'The reason the variable was deleted',
    maximum_allowed_daily_value DOUBLE PRECISION COMMENT 'The maximum allowed value in the default unit for measurements aggregated over a single day',
    is_public BOOLEAN,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_goal frequency_type_enum DEFAULT 'never' COMMENT 'The effect of a food on symptom severity is useful because you can control the predictor directly. However, the effect of a symptom on foods eaten is not very useful',
    controllable frequency_type_enum DEFAULT 'never' COMMENT 'You can control foods eaten directly. However, symptom severity or weather is not directly controllable',
    boring BOOLEAN COMMENT 'The variable is boring if the average person would not be interested in its causes or effects',
    slug VARCHAR(200) UNIQUE COMMENT 'The slug is the part of a URL that identifies a page in human-readable keywords',
    canonical_variable_id INTEGER REFERENCES reference.variables(id) COMMENT 'If a variable duplicates another but with a different name, set the canonical variable id to match the variable with the more appropriate name',
    predictor BOOLEAN COMMENT 'predictor is true if the variable is a factor that could influence an outcome of interest',
    source_url VARCHAR(2083) COMMENT 'URL for the website related to the database containing the info that was used to create this variable',
    string_id VARCHAR(125)
);

-- Create indexes
CREATE INDEX idx_variables_category_unit ON reference.variables (variable_category_id, default_unit_id, name, number_of_user_variables, id);
CREATE INDEX idx_variables_default_unit ON reference.variables (default_unit_id);
CREATE INDEX idx_variables_deleted_synonyms ON reference.variables (deleted_at, synonyms, number_of_user_variables);
CREATE INDEX idx_variables_analysis_ended ON reference.variables (analysis_ended_at);
CREATE INDEX idx_variables_name_users ON reference.variables (name, number_of_user_variables);

-- Enable RLS
ALTER TABLE reference.variables ENABLE ROW LEVEL SECURITY;

-- Add table comments
COMMENT ON TABLE reference.variables IS 'Variable overviews with statistics, analysis settings, and data visualizations and likely outcomes or predictors based on the anonymously aggregated donated data.';