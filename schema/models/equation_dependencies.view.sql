-- View: models.equation_dependencies

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
