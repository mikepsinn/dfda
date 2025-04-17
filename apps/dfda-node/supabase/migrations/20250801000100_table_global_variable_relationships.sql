-- Migration: Create global_variable_relationships table

-- NOTE: This migration assumes the following exist:
-- 1. extensions.uuid_generate_v4() (usually from uuid-ossp extension)
-- 2. extensions.moddatetime trigger function
-- 3. tables: global_variables, citations, conditions, units

-- 1. Create global_variable_relationships table
CREATE TABLE global_variable_relationships (
  id TEXT PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  predictor_global_variable_id TEXT NOT NULL REFERENCES global_variables(id),
  outcome_global_variable_id TEXT NOT NULL REFERENCES global_variables(id),
  citation_id TEXT NOT NULL REFERENCES citations(id),
  condition_id TEXT NULL REFERENCES conditions(id), -- Optional context

  -- Categorization for display (e.g., in OutcomeLabel)
  category TEXT NOT NULL, -- e.g., 'Primary Outcome', 'Side Effect', 'Nutritional Info'
  category_display_order INT NULL,
  item_display_order INT NULL,

  -- Outcome metrics from the citation
  baseline_description TEXT NULL,
  percentage_change REAL NULL, -- Using REAL for potentially fractional percentages
  absolute_change_value REAL NULL,
  absolute_change_unit_id TEXT NULL REFERENCES units(id), -- Optional FK
  nnh REAL NULL, -- Number Needed to Harm
  nnt REAL NULL, -- Number Needed to Treat/Benefit
  is_positive_outcome BOOLEAN NULL, -- Semantic meaning (true=good, false=bad, null=neutral/unknown)

  -- Optional data quality/notes specific to this finding
  -- Consider adding an enum for confidence_level if desired later
  -- confidence_level evidence_confidence NULL, 
  finding_specific_notes TEXT NULL,
  data_last_updated TIMESTAMPTZ NULL, -- When this specific finding was last verified

  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE global_variable_relationships ENABLE ROW LEVEL SECURITY;

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON global_variable_relationships
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- 2. Add Indexes for faster lookups
CREATE INDEX idx_gvr_predictor_id ON global_variable_relationships(predictor_global_variable_id);
CREATE INDEX idx_gvr_outcome_id ON global_variable_relationships(outcome_global_variable_id);
CREATE INDEX idx_gvr_citation_id ON global_variable_relationships(citation_id);
CREATE INDEX idx_gvr_condition_id ON global_variable_relationships(condition_id) WHERE condition_id IS NOT NULL;

-- 3. Add Unique Constraints to prevent duplicate findings

-- Constraint for findings with a specific condition context
CREATE UNIQUE INDEX idx_unique_gvr_finding_with_condition
ON global_variable_relationships (
    predictor_global_variable_id,
    outcome_global_variable_id,
    citation_id,
    condition_id -- Included here
)
WHERE condition_id IS NOT NULL;

-- Constraint for findings without a specific condition context
CREATE UNIQUE INDEX idx_unique_gvr_finding_no_condition
ON global_variable_relationships (
    predictor_global_variable_id,
    outcome_global_variable_id,
    citation_id
    -- condition_id is implicitly NULL here due to the WHERE clause
)
WHERE condition_id IS NULL;


-- 4. Add Policies (Allow public read access)
CREATE POLICY "Allow public read access" ON global_variable_relationships
  FOR SELECT
  USING (true);

-- Example: Allow admin role (or specific service role) to insert/update/delete
-- CREATE POLICY "Allow admin management access" ON global_variable_relationships
--   FOR ALL
--   USING (is_claims_admin())
--   WITH CHECK (is_claims_admin()); 