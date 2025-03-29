-- Create units table
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY, -- Will be populated with stringified name (e.g., 'kilogram')
  unit_category_id TEXT NOT NULL REFERENCES unit_categories(id) ON DELETE RESTRICT, -- Renamed from category_id
  name TEXT NOT NULL, -- Full name (e.g., 'Kilogram')
  abbreviated_name TEXT NOT NULL, -- User-facing symbol (e.g., 'kg')
  ucum_code TEXT, -- UCUM code where applicable (e.g., 'kg', '[lb_av]')
  conversion_factor NUMERIC NOT NULL,
  conversion_offset NUMERIC DEFAULT 0 NOT NULL,
  is_si BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (unit_category_id, ucum_code) -- Ensure UCUM code is unique within a category if present
);