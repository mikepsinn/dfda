-- Model equations table for storing mathematical relationships
CREATE TABLE models.model_equations (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    equation_type text NOT NULL CHECK (equation_type IN ('differential', 'algebraic', 'statistical', 'machine_learning', 'other')),
    equation_latex text NOT NULL,
    equation_code text,
    input_variables bigint[] NOT NULL, -- Array of global_variables ids used as inputs
    output_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    parameter_set_id bigint REFERENCES models.parameter_sets(id),
    validation_rules jsonb,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_input_variables CHECK (array_length(input_variables, 1) > 0)
);

-- Enable row level security
ALTER TABLE models.model_equations ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON models.model_equations
    FOR SELECT USING (true);

-- Create index for input variables array
CREATE INDEX model_equations_input_vars_idx ON models.model_equations USING GIN (input_variables);

COMMENT ON TABLE models.model_equations IS 'Mathematical equations and relationships used in the models';
COMMENT ON COLUMN models.model_equations.equation_type IS 'Type of equation (differential, algebraic, statistical, etc.)';
COMMENT ON COLUMN models.model_equations.equation_latex IS 'LaTeX representation of the equation';
COMMENT ON COLUMN models.model_equations.equation_code IS 'Computational representation of the equation (e.g. Python/R code)';
COMMENT ON COLUMN models.model_equations.input_variables IS 'Array of global_variables ids used as inputs to the equation';
COMMENT ON COLUMN models.model_equations.output_variable_id IS 'The variable this equation calculates';
COMMENT ON COLUMN models.model_equations.validation_rules IS 'Rules for validating equation inputs and outputs';

-- Create equation dependencies view
CREATE VIEW models.equation_dependencies AS
WITH RECURSIVE deps AS (
    -- Base case: direct dependencies
    SELECT 
        id,
        name,
        input_variables as deps,
        1 as depth
    FROM models.model_equations
    
    UNION ALL
    
    -- Recursive case: dependencies of dependencies
    SELECT 
        d.id,
        d.name,
        array_cat(d.deps, e.input_variables) as deps,
        d.depth + 1 as depth
    FROM deps d
    JOIN models.model_equations e ON ANY(d.deps) = e.output_variable_id
    WHERE d.depth < 10  -- Prevent infinite recursion
)
SELECT DISTINCT ON (id)
    id,
    name,
    deps as all_dependencies,
    depth as dependency_depth
FROM deps
ORDER BY id, depth DESC;

COMMENT ON VIEW models.equation_dependencies IS 'Shows all variable dependencies for each equation, including indirect dependencies'; 