-- Table: reference.variables

CREATE TABLE reference.variables (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(125) NOT NULL UNIQUE,
    number_of_user_variables INTEGER DEFAULT 0 NOT NULL,
    variable_category_id INTEGER NOT NULL REFERENCES reference.variable_categories(id),
    default_unit_id VARCHAR(50) NOT NULL REFERENCES reference.units_of_measurement(id),
    default_value DOUBLE PRECISION,
    cause_only BOOLEAN,
    client_id VARCHAR(80),
    combination_operation combination_operation_enum DEFAULT 'mean',
    common_alias VARCHAR(125),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description TEXT,
    duration_of_action INTEGER,
    filling_value DOUBLE PRECISION DEFAULT -1,
    image_url VARCHAR(2083),
    informational_url VARCHAR(2083),
    ion_icon VARCHAR(40),
    maximum_allowed_value DOUBLE PRECISION,
    minimum_allowed_value DOUBLE PRECISION,
    most_common_original_unit_id VARCHAR(50),
    onset_delay INTEGER,
    outcome BOOLEAN,
    parent_id INTEGER REFERENCES reference.variables(id),
    price DOUBLE PRECISION,
    product_url VARCHAR(2083),
    status VARCHAR(25) DEFAULT 'WAITING' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    most_common_connector_id INTEGER,
    synonyms VARCHAR(600),
    wikipedia_url VARCHAR(2083),
    brand_name VARCHAR(125),
    valence valence_type_enum DEFAULT 'neutral',
    wikipedia_title VARCHAR(100),
    upc_12 VARCHAR(255),
    upc_14 VARCHAR(255),
    deleted_at TIMESTAMPTZ,
    most_common_source_name VARCHAR(255),
    data_sources_count TEXT,
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
    deletion_reason VARCHAR(280),
    maximum_allowed_daily_value DOUBLE PRECISION,
    is_public BOOLEAN,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_goal frequency_type_enum DEFAULT 'never',
    controllable frequency_type_enum DEFAULT 'never',
    boring BOOLEAN,
    slug VARCHAR(200) UNIQUE,
    canonical_variable_id INTEGER REFERENCES reference.variables(id),
    predictor BOOLEAN,
    source_url VARCHAR(2083),
    string_id VARCHAR(125)
);

-- Add column comments
COMMENT ON COLUMN reference.variables.name IS 'User-defined variable display name';
COMMENT ON COLUMN reference.variables.number_of_user_variables IS 'Number of variables';
COMMENT ON COLUMN reference.variables.cause_only IS 'A value of true indicates that this variable is generally a cause in a causal relationship. An example would be Cloud Cover which would generally not be influenced by user behavior';
COMMENT ON COLUMN reference.variables.combination_operation IS 'How to combine values of this variable (for instance, to see a summary of the values over a month)';
COMMENT ON COLUMN reference.variables.duration_of_action IS 'How long the effect of a measurement in this variable lasts';
COMMENT ON COLUMN reference.variables.filling_value IS 'Value for replacing null measurements';
COMMENT ON COLUMN reference.variables.maximum_allowed_value IS 'Maximum reasonable value for a single measurement for this variable in the default unit';
COMMENT ON COLUMN reference.variables.minimum_allowed_value IS 'Minimum reasonable value for this variable (uses default unit)';
COMMENT ON COLUMN reference.variables.most_common_original_unit_id IS 'Most common Unit ID';
COMMENT ON COLUMN reference.variables.onset_delay IS 'How long it takes for a measurement in this variable to take effect';
COMMENT ON COLUMN reference.variables.outcome IS 'Outcome variables are those for which a human would generally want to identify influencing factors. These include symptoms, physique, mood, cognitive performance, etc.';
COMMENT ON COLUMN reference.variables.parent_id IS 'ID of the parent variable if this variable has any parent';
COMMENT ON COLUMN reference.variables.price IS 'Price';
COMMENT ON COLUMN reference.variables.product_url IS 'Product URL';
COMMENT ON COLUMN reference.variables.status IS 'status';
COMMENT ON COLUMN reference.variables.synonyms IS 'The primary variable name and any synonyms for it. This field should be used for non-specific variable searches.';
COMMENT ON COLUMN reference.variables.data_sources_count IS 'Array of connector or client measurement data source names as key with number of users as value';
COMMENT ON COLUMN reference.variables.deletion_reason IS 'The reason the variable was deleted';
COMMENT ON COLUMN reference.variables.maximum_allowed_daily_value IS 'The maximum allowed value in the default unit for measurements aggregated over a single day';
COMMENT ON COLUMN reference.variables.is_goal IS 'The effect of a food on symptom severity is useful because you can control the predictor directly. However, the effect of a symptom on foods eaten is not very useful';
COMMENT ON COLUMN reference.variables.controllable IS 'You can control foods eaten directly. However, symptom severity or weather is not directly controllable';
COMMENT ON COLUMN reference.variables.boring IS 'The variable is boring if the average person would not be interested in its causes or effects';
COMMENT ON COLUMN reference.variables.slug IS 'The slug is the part of a URL that identifies a page in human-readable keywords';
COMMENT ON COLUMN reference.variables.canonical_variable_id IS 'If a variable duplicates another but with a different name, set the canonical variable id to match the variable with the more appropriate name';
COMMENT ON COLUMN reference.variables.predictor IS 'predictor is true if the variable is a factor that could influence an outcome of interest';
COMMENT ON COLUMN reference.variables.source_url IS 'URL for the website related to the database containing the info that was used to create this variable';
