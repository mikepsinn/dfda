-- Create treatments table
CREATE TABLE IF NOT EXISTS treatments (
  id TEXT PRIMARY KEY REFERENCES global_variables(id),
  treatment_type TEXT NOT NULL, -- Removed CHECK constraint as it doesn't match database.types.ts
  manufacturer TEXT,
  dosage_form TEXT NULL, -- Added from treatment_details
  dosage_instructions TEXT NULL, -- Added from treatment_details
  active_ingredients JSONB NULL, -- Added from treatment_details
  -- approval_status TEXT CHECK (approval_status IN ('approved', 'investigational', 'not_approved')), -- Removed in favor of regulatory_approvals table
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for new columns
COMMENT ON COLUMN public.treatments.dosage_form IS 'General dosage form of the treatment product (e.g., tablet, liquid). Merged from treatment_details.';
COMMENT ON COLUMN public.treatments.dosage_instructions IS 'General instructions for the treatment product as a whole. Merged from treatment_details.';
COMMENT ON COLUMN public.treatments.active_ingredients IS 'JSONB array of active ingredients and their strengths. Merged from treatment_details. Format: [{ "ingredient_global_variable_id": "uuid", "strength_quantity": 200, "strength_unit_id": "uuid" }]';

-- Optional: Index for active_ingredients if needed
-- CREATE INDEX idx_treatments_active_ingredients ON public.treatments USING GIN (active_ingredients);