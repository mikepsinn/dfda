-- Create global_variables table
CREATE TABLE IF NOT EXISTS global_variables (
  id TEXT PRIMARY KEY,
  variable_category_id TEXT NOT NULL REFERENCES variable_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT, -- Added emoji column
  default_unit_id TEXT REFERENCES units(id) ON DELETE RESTRICT, -- Renamed from unit_category_id, references specific unit
  canonical_global_variable_id TEXT REFERENCES global_variables(id) ON DELETE SET NULL, -- Added for synonym handling
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);