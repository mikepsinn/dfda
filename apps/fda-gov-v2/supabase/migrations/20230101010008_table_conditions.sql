-- Create conditions table
CREATE TABLE IF NOT EXISTS conditions (
  id TEXT PRIMARY KEY REFERENCES global_variables(id),

  icd_code TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);