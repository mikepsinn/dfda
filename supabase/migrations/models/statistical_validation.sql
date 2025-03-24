-- Statistical validation table for storing analysis methods and covariates
CREATE TABLE models.statistical_validation (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    simulation_output_id bigint NOT NULL REFERENCES models.simulation_outputs(id),
    analysis_method text NOT NULL,
    covariates text[] NOT NULL,
    statistical_tests jsonb NOT NULL,
    confidence_level numeric NOT NULL CHECK (confidence_level BETWEEN 0 AND 1),
    p_value numeric,
    sample_size bigint,
    power_analysis jsonb,
    methodology_notes text,
    limitations text,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_analysis_method CHECK (
        analysis_method IN (
            'poisson_regression',
            'cox_proportional_hazards',
            'linear_regression',
            'logistic_regression',
            'mixed_effects_model',
            'other'
        )
    )
);

-- Enable row level security
ALTER TABLE models.statistical_validation ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.statistical_validation
    FOR SELECT USING (true);

COMMENT ON TABLE models.statistical_validation IS 'Statistical validation methods and results for model outputs';
COMMENT ON COLUMN models.statistical_validation.analysis_method IS 'Statistical method used for analysis';
COMMENT ON COLUMN models.statistical_validation.covariates IS 'Array of covariates included in the analysis';
COMMENT ON COLUMN models.statistical_validation.statistical_tests IS 'JSON object containing test results';
COMMENT ON COLUMN models.statistical_validation.power_analysis IS 'Power analysis results and parameters';
COMMENT ON COLUMN models.statistical_validation.methodology_notes IS 'Notes about the statistical methodology';
COMMENT ON COLUMN models.statistical_validation.limitations IS 'Known limitations of the statistical analysis'; 