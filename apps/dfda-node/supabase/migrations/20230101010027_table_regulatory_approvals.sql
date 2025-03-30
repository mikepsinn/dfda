-- Create regulatory_approvals table
CREATE TABLE IF NOT EXISTS regulatory_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id TEXT NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  agency TEXT NOT NULL, -- e.g., FDA, EMA, PMDA
  region TEXT NOT NULL, -- e.g., US, EU, JP
  status TEXT NOT NULL CHECK (status IN ('Approved', 'Investigational', 'Denied', 'Withdrawn')),
  indication TEXT, -- Specific indication for approval
  decision_date DATE, -- Date of the approval decision
  notes TEXT, -- Additional notes or context
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE regulatory_approvals ENABLE ROW LEVEL SECURITY;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_regulatory_approvals_treatment ON regulatory_approvals(treatment_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_approvals_agency_region ON regulatory_approvals(agency, region);

-- Basic policies (adjust as needed)
CREATE POLICY "Allow public read access" ON regulatory_approvals FOR SELECT USING (true);
-- Add policies for authenticated users, specific roles, etc.
-- CREATE POLICY "Allow authenticated insert access" ON regulatory_approvals FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Allow owner update/delete access" ON regulatory_approvals FOR UPDATE USING (auth.uid() = user_id);
-- CREATE POLICY "Allow owner update/delete access" ON regulatory_approvals FOR DELETE USING (auth.uid() = user_id); -- Assuming user_id column exists, adjust if needed
