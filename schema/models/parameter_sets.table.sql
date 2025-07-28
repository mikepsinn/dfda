-- Table: models.parameter_sets

CREATE TABLE models.parameter_sets (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    parameters jsonb NOT NULL,
    scenario_type text NOT NULL CHECK (scenario_type IN ('base', 'best', 'worst')),
    -- Time value parameters
    time_horizon_years integer NOT NULL,
    discount_rate numeric NOT NULL,
    inflation_rate numeric,
    present_value_factor numeric NOT NULL,
    metadata jsonb,
    is_baseline boolean DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);
