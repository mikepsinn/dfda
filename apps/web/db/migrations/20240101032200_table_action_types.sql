-- Create action types table
CREATE TABLE IF NOT EXISTS action_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category action_category NOT NULL,
  description TEXT,
  requires_scheduling BOOLEAN DEFAULT false,
  requires_results BOOLEAN DEFAULT false,
  can_be_recurring BOOLEAN DEFAULT false,
  default_duration_minutes INTEGER,
  metadata JSONB,
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (name, category)
);
