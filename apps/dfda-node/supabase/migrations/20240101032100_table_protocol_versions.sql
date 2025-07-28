-- Create protocol_versions table to track trial protocol versions
CREATE TABLE IF NOT EXISTS protocol_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'superseded')),
  effective_date TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES profiles(id),
  schedule JSONB NOT NULL, -- Array of visit schedules with required/optional actions
  metadata JSONB, -- Additional protocol-specific metadata
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (trial_id, version_number)
); 