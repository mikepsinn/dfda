-- Create trials table
CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  sponsor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  condition_id TEXT NOT NULL REFERENCES conditions(id) ON DELETE RESTRICT,
  treatment_id TEXT NOT NULL REFERENCES treatments(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'recruiting', 'active', 'completed', 'terminated')),
  phase TEXT CHECK (phase IN ('phase_1', 'phase_2', 'phase_3', 'phase_4')),
  start_date DATE,
  end_date DATE,
  enrollment_target INT,
  current_enrollment INT DEFAULT 0,
  location TEXT,
  compensation NUMERIC,
  inclusion_criteria TEXT[],
  exclusion_criteria TEXT[],
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);