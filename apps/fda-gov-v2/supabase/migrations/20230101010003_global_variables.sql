-- Create global_variables table
CREATE TABLE IF NOT EXISTS global_variables (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL REFERENCES variable_categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  unit_category_id TEXT REFERENCES unit_categories(id) ON DELETE RESTRICT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 