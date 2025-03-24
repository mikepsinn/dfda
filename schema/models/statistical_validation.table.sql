-- Table: models.statistical_validation

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
