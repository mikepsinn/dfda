-- Create user_variables table
CREATE TABLE IF NOT EXISTS user_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  global_variable_id TEXT NOT NULL REFERENCES global_variables(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  unit_category_id TEXT REFERENCES unit_categories(id) ON DELETE RESTRICT,
  emoji TEXT,
  image_url TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Add unique constraint to prevent duplicate tracking
  CONSTRAINT user_variables_user_global_variable_unique UNIQUE (user_id, global_variable_id)
);