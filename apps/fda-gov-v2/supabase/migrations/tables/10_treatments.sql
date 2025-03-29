-- Create treatments table
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  treatment_type TEXT NOT NULL CHECK (treatment_type IN ('medication', 'procedure', 'lifestyle', 'device', 'other')),
  manufacturer TEXT,
  approval_status TEXT CHECK (approval_status IN ('approved', 'investigational', 'not_approved')),
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 