-- Table: models.model_equations

CREATE TABLE models.model_equations (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    equation_type text NOT NULL CHECK (equation_type IN ('differential', 'algebraic', 'statistical', 'machine_learning', 'other')),
    equation_latex text NOT NULL,
    equation_code text,
    input_variables bigint[] NOT NULL, -- Array of variables ids used as inputs
    output_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    parameter_set_id bigint REFERENCES models.parameter_sets(id),
    validation_rules jsonb,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_input_variables CHECK (array_length(input_variables, 1) > 0)
);
