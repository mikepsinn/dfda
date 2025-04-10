-- Treatment effectiveness and side effects tables

-- Create treatment_types table
CREATE TABLE IF NOT EXISTS treatment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create treatments table with emoji and image fields
CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  treatment_type_id UUID REFERENCES treatment_types(id) ON DELETE SET NULL,
  description TEXT,
  typical_dosage TEXT,
  frequency TEXT,
  duration TEXT,
  emoji TEXT, -- Optional emoji representation
  image_url TEXT, -- Optional URL to an image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_treatments junction table
CREATE TABLE IF NOT EXISTS user_treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE CASCADE,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, treatment_id)
);

-- Create treatment_effectiveness_ratings table
CREATE TABLE IF NOT EXISTS treatment_effectiveness_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE CASCADE,
  condition_id UUID REFERENCES conditions(id) ON DELETE CASCADE,
  symptom_id UUID REFERENCES symptoms(id) ON DELETE CASCADE,
  effectiveness_rating INTEGER NOT NULL CHECK (effectiveness_rating >= 0 AND effectiveness_rating <= 10), -- 0-10 scale
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT treatment_effectiveness_target_check CHECK (
    (condition_id IS NOT NULL AND symptom_id IS NULL) OR
    (condition_id IS NULL AND symptom_id IS NOT NULL)
  )
);

-- Create treatment_side_effects table with emoji and image fields
CREATE TABLE IF NOT EXISTS treatment_side_effects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT,
  emoji TEXT, -- Optional emoji representation
  image_url TEXT, -- Optional URL to an image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create treatment_side_effect_ratings table
CREATE TABLE IF NOT EXISTS treatment_side_effect_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES treatments(id) ON DELETE CASCADE,
  side_effect_id UUID REFERENCES treatment_side_effects(id) ON DELETE CASCADE,
  severity_rating INTEGER NOT NULL CHECK (severity_rating >= 0 AND severity_rating <= 10), -- 0-10 scale
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
