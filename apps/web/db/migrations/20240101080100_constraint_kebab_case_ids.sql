-- Add CHECK constraints to enforce kebab-case format for IDs

-- Constraint for global_variables table
ALTER TABLE global_variables
ADD CONSTRAINT global_variables_id_must_be_kebab_case
CHECK (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Constraint for units table
ALTER TABLE units
ADD CONSTRAINT units_id_must_be_kebab_case
CHECK (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Constraint for variable_categories table
ALTER TABLE variable_categories
ADD CONSTRAINT variable_categories_id_must_be_kebab_case
CHECK (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');

-- Constraint for unit_categories table
ALTER TABLE unit_categories
ADD CONSTRAINT unit_categories_id_must_be_kebab_case
CHECK (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
