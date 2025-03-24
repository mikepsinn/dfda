-- Table: models.cost_breakdowns

CREATE TABLE models.cost_breakdowns (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    simulation_output_id bigint NOT NULL REFERENCES models.simulation_outputs(id),
    cost_category text NOT NULL,
    subcategory text,
    amount numeric NOT NULL,
    percentage_of_total numeric NOT NULL CHECK (percentage_of_total BETWEEN 0 AND 100),
    population_segment_id bigint REFERENCES reference.population_segments(id),
    age_group text,
    calculation_notes text,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_cost_category CHECK (
        cost_category IN (
            'healthcare_savings',
            'productivity_gains',
            'qaly_value',
            'medicare_impact',
            'long_term_savings'
        )
    )
);
