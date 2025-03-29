-- Create reported_side_effects table
CREATE TABLE IF NOT EXISTS reported_side_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  treatment_id TEXT NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  severity_out_of_ten INT CHECK (severity_out_of_ten BETWEEN 0 AND 10), -- Changed name and range (0-10)
  unit_id TEXT NOT NULL DEFAULT 'zero-to-ten-scale' REFERENCES units(id),
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reported_side_effects_treatment_user 
ON reported_side_effects(treatment_id, user_id);
