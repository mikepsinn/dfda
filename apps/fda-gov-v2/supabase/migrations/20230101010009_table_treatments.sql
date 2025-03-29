-- Create treatments table
CREATE TABLE IF NOT EXISTS treatments (
  id TEXT PRIMARY KEY REFERENCES global_variables(id),
  treatment_type TEXT NOT NULL CHECK (treatment_type IN ('drug', 'biologic', 'procedure', 'lifestyle', 'device', 'other')),
  manufacturer TEXT,
  -- approval_status TEXT CHECK (approval_status IN ('approved', 'investigational', 'not_approved')), -- Removed in favor of regulatory_approvals table
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);