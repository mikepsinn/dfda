-- Create treatment_ratings table
CREATE TABLE IF NOT EXISTS treatment_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  treatment_id TEXT NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  condition_id TEXT NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  effectiveness_out_of_ten INT CHECK (effectiveness_out_of_ten BETWEEN 0 AND 10), -- Changed range to 0-10
  unit_id TEXT NOT NULL DEFAULT 'zero-to-ten-scale' REFERENCES units(id),
  review TEXT,
  helpful_count INT DEFAULT 0,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);