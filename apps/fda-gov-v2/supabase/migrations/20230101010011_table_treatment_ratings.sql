-- Create treatment_ratings table
CREATE TABLE IF NOT EXISTS treatment_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  treatment_id TEXT NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  condition_id TEXT NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  effectiveness INT CHECK (effectiveness BETWEEN 1 AND 5),
  side_effects INT CHECK (side_effects BETWEEN 1 AND 5),
  review TEXT,
  helpful_count INT DEFAULT 0,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);