-- Drop the old approval_status column from treatments table
-- This is replaced by the new regulatory_approvals table
ALTER TABLE treatments
DROP COLUMN IF EXISTS approval_status;
