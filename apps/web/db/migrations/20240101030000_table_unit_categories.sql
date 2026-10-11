-- Create unit_categories table
CREATE TABLE IF NOT EXISTS unit_categories (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  base_unit_id TEXT, -- FK added in a separate migration
  emoji TEXT,
  image_url TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);