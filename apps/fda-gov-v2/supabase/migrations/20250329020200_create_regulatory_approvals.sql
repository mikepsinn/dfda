-- Create regulatory_approvals table to track approvals per agency/region
CREATE TABLE IF NOT EXISTS regulatory_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id TEXT NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  agency TEXT NOT NULL, -- e.g., 'FDA', 'EMA', 'PMDA', 'dFDA'
  region TEXT, -- e.g., 'US', 'EU', 'JP', 'Global'
  status TEXT NOT NULL CHECK (status IN ('Approved', 'Investigational', 'Denied', 'Withdrawn', 'Pending Review')), -- Added 'Pending Review'
  indication TEXT, -- Specific use the treatment is approved for
  approval_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure a treatment can only have one status per agency/region combination
  CONSTRAINT unique_treatment_agency_region UNIQUE (treatment_id, agency, region)
);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_regulatory_approvals_treatment_id ON regulatory_approvals(treatment_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_approvals_agency ON regulatory_approvals(agency);
CREATE INDEX IF NOT EXISTS idx_regulatory_approvals_status ON regulatory_approvals(status);

-- Enable Row Level Security
ALTER TABLE regulatory_approvals ENABLE ROW LEVEL SECURITY;

-- TODO: Define appropriate RLS policies for regulatory_approvals
-- Example (allow public read access):
-- CREATE POLICY "Allow public read access" ON regulatory_approvals
-- FOR SELECT USING (true);

-- TODO: Consider adding policies for insert/update/delete based on user roles (e.g., admin, regulator)
