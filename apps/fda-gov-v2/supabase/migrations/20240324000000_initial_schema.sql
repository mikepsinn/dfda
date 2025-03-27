-- Create tables
CREATE TABLE IF NOT EXISTS conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icd_code TEXT,
  global_variable_id UUID, -- Will be linked to global_variables
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  treatment_type TEXT NOT NULL,
  manufacturer TEXT,
  approval_status TEXT NOT NULL,
  global_variable_id UUID, -- Will be linked to global_variables
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS treatment_effectiveness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  effectiveness_score NUMERIC NOT NULL,
  side_effects_score NUMERIC NOT NULL,
  cost_effectiveness_score NUMERIC NOT NULL,
  evidence_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- New tables for measurement tracking

-- Unit categories table
CREATE TABLE IF NOT EXISTS unit_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  emoji TEXT, -- Emoji representation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Units table for measurement units with conversion capability
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  emoji TEXT, -- Emoji representation
  unit_category_id UUID NOT NULL REFERENCES unit_categories(id) ON DELETE CASCADE,
  conversion_factor NUMERIC DEFAULT 1, -- For linear conversions: new_value = old_value * factor + offset
  conversion_offset NUMERIC DEFAULT 0, -- For offset conversions like Celsius to Fahrenheit
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_unit_abbreviation_per_category UNIQUE (abbreviation, unit_category_id)
);

-- Variable categories
CREATE TABLE IF NOT EXISTS variable_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  emoji TEXT, -- Emoji representation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Global variables table for storing types of measurements
CREATE TABLE IF NOT EXISTS global_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  variable_category_id UUID NOT NULL REFERENCES variable_categories(id) ON DELETE CASCADE,
  default_unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  description TEXT,
  emoji TEXT, -- Emoji representation
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_name_per_category UNIQUE (name, variable_category_id)
);

-- Now add foreign key constraints after all tables are created
ALTER TABLE conditions 
ADD CONSTRAINT fk_conditions_global_variable 
FOREIGN KEY (global_variable_id) REFERENCES global_variables(id) ON DELETE SET NULL;

ALTER TABLE treatments 
ADD CONSTRAINT fk_treatments_global_variable 
FOREIGN KEY (global_variable_id) REFERENCES global_variables(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  organization_name TEXT,
  contact_name TEXT,
  user_type TEXT NOT NULL CHECK (user_type IN ('patient', 'doctor', 'sponsor')) DEFAULT 'patient',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User variables table (variables that users track)
CREATE TABLE IF NOT EXISTS user_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variable_id UUID NOT NULL REFERENCES global_variables(id) ON DELETE CASCADE,
  user_default_unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  -- Reminder settings (Google Calendar style)
  reminder_enabled BOOLEAN DEFAULT false,
  reminder_frequency TEXT, -- daily, weekly, monthly, custom
  reminder_interval INTEGER DEFAULT 1, -- every X days/weeks/months
  reminder_days INTEGER[], -- days of week (0-6 for Sunday-Saturday)
  reminder_times TIME[], -- times of day
  reminder_start_date DATE,
  reminder_end_date DATE,
  custom_recurrence_rule TEXT, -- RFC 5545 (iCalendar) RRULE for complex patterns
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_variable UNIQUE (user_id, variable_id)
);

-- Measurements table
CREATE TABLE IF NOT EXISTS measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  variable_id UUID NOT NULL REFERENCES global_variables(id) ON DELETE CASCADE,
  user_variable_id UUID REFERENCES user_variables(id) ON DELETE CASCADE,
  value NUMERIC NOT NULL,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL,
  end_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Treatment side effect ratings
CREATE TABLE IF NOT EXISTS treatment_side_effect_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  side_effect_variable_id UUID NOT NULL REFERENCES global_variables(id) ON DELETE CASCADE,
  severity_rating INTEGER NOT NULL CHECK (severity_rating BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_treatment_side_effect UNIQUE (user_id, treatment_id, side_effect_variable_id)
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Anyone can view doctor profiles"
  ON profiles FOR SELECT
  USING (user_type = 'doctor');

CREATE POLICY "Anyone can view sponsor profiles"
  ON profiles FOR SELECT
  USING (user_type = 'sponsor');

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create indexes for profiles
CREATE INDEX profiles_user_type_idx ON profiles(user_type);
CREATE INDEX profiles_email_idx ON profiles(email);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE IF NOT EXISTS treatment_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL,
  review TEXT,
  user_type TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sponsor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  phase TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  enrollment_target INTEGER NOT NULL,
  current_enrollment INTEGER DEFAULT 0,
  location TEXT,
  compensation NUMERIC,
  inclusion_criteria JSONB,
  exclusion_criteria JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trial_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id UUID NOT NULL REFERENCES trials(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL,
  enrollment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completion_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS data_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES trial_enrollments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_date TIMESTAMP WITH TIME ZONE NOT NULL,
  data JSONB NOT NULL,
  status TEXT NOT NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  review_date TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default variable categories
INSERT INTO variable_categories (name, description) VALUES 
('Conditions', 'Medical conditions and diagnoses'),
('Treatments', 'Medications and other medical treatments'),
('Symptoms', 'Patient-reported symptoms'),
('Side Effects', 'Adverse effects from treatments'),
('Foods', 'Food and nutrition intake'),
('Vital Signs', 'Medical vital measurements');

-- Create functions for syncing between interface tables and global_variables

-- Sync condition to global variable
CREATE OR REPLACE FUNCTION sync_condition_to_global_variable()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
BEGIN
  -- Get the conditions category ID
  SELECT id INTO v_category_id FROM variable_categories WHERE name = 'Conditions';
  
  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Conditions category not found';
  END IF;
  
  -- When a condition is created/updated, sync to global_variables
  IF NEW.global_variable_id IS NULL THEN
    INSERT INTO global_variables (
      name, 
      variable_category_id, 
      description
    )
    VALUES (
      NEW.name,
      v_category_id,
      NEW.description
    )
    ON CONFLICT (name, variable_category_id) 
    DO UPDATE SET description = NEW.description
    RETURNING id INTO NEW.global_variable_id;
  ELSE
    -- Update existing global variable
    UPDATE global_variables
    SET name = NEW.name,
        description = NEW.description
    WHERE id = NEW.global_variable_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sync treatment to global variable
CREATE OR REPLACE FUNCTION sync_treatment_to_global_variable()
RETURNS TRIGGER AS $$
DECLARE
  v_category_id UUID;
BEGIN
  -- Get the treatments category ID
  SELECT id INTO v_category_id FROM variable_categories WHERE name = 'Treatments';
  
  IF v_category_id IS NULL THEN
    RAISE EXCEPTION 'Treatments category not found';
  END IF;
  
  -- When a treatment is created/updated, sync to global_variables
  IF NEW.global_variable_id IS NULL THEN
    INSERT INTO global_variables (
      name, 
      variable_category_id, 
      description
    )
    VALUES (
      NEW.name,
      v_category_id,
      NEW.description
    )
    ON CONFLICT (name, variable_category_id) 
    DO UPDATE SET description = NEW.description
    RETURNING id INTO NEW.global_variable_id;
  ELSE
    -- Update existing global variable
    UPDATE global_variables
    SET name = NEW.name,
        description = NEW.description
    WHERE id = NEW.global_variable_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for syncing interface tables with global_variables
CREATE TRIGGER condition_to_global_variable_trigger
BEFORE INSERT OR UPDATE ON conditions
FOR EACH ROW EXECUTE FUNCTION sync_condition_to_global_variable();

CREATE TRIGGER treatment_to_global_variable_trigger
BEFORE INSERT OR UPDATE ON treatments
FOR EACH ROW EXECUTE FUNCTION sync_treatment_to_global_variable();

-- Create functions
CREATE OR REPLACE FUNCTION get_average_treatment_rating(p_treatment_id UUID, p_condition_id UUID)
RETURNS TABLE (average NUMERIC, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating), 0) as average,
    COUNT(*) as count
  FROM treatment_ratings
  WHERE treatment_id = p_treatment_id
  AND condition_id = p_condition_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_helpful_count(p_rating_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE treatment_ratings
  SET helpful_count = helpful_count + 1
  WHERE id = p_rating_id;
END;
$$ LANGUAGE plpgsql;

-- Helper function to convert measurement units
CREATE OR REPLACE FUNCTION convert_measurement_value(
  p_value NUMERIC, 
  p_from_unit_id UUID, 
  p_to_unit_id UUID
)
RETURNS NUMERIC AS $$
DECLARE
  v_from_factor NUMERIC;
  v_from_offset NUMERIC;
  v_to_factor NUMERIC;
  v_to_offset NUMERIC;
  v_standard_value NUMERIC;
  v_result NUMERIC;
  v_same_category BOOLEAN;
BEGIN
  -- Check if units are in the same category
  SELECT COUNT(*) > 0 INTO v_same_category 
  FROM units u1, units u2
  WHERE u1.id = p_from_unit_id 
  AND u2.id = p_to_unit_id
  AND u1.unit_category_id = u2.unit_category_id;
  
  IF NOT v_same_category THEN
    RAISE EXCEPTION 'Cannot convert between units of different categories';
  END IF;

  -- If units are the same, no conversion needed
  IF p_from_unit_id = p_to_unit_id THEN
    RETURN p_value;
  END IF;

  -- Get conversion factors and offsets
  SELECT conversion_factor, conversion_offset INTO v_from_factor, v_from_offset
  FROM units WHERE id = p_from_unit_id;
  
  SELECT conversion_factor, conversion_offset INTO v_to_factor, v_to_offset
  FROM units WHERE id = p_to_unit_id;
  
  -- Convert to standard unit (factor = 1, offset = 0)
  v_standard_value := (p_value - v_from_offset) / v_from_factor;
  
  -- Convert from standard unit to target unit
  v_result := (v_standard_value * v_to_factor) + v_to_offset;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Create a view to get all patient conditions
CREATE VIEW patient_conditions AS
SELECT 
  m.user_id AS patient_id,
  g.id AS variable_id,
  c.id AS condition_id,
  g.name AS condition_name,
  c.description,
  c.icd_code,
  MAX(m.start_at) AS diagnosed_at,
  COUNT(m.id) AS measurement_count
FROM measurements m
JOIN global_variables g ON m.variable_id = g.id
JOIN conditions c ON c.global_variable_id = g.id
WHERE g.variable_category_id = (SELECT id FROM variable_categories WHERE name = 'Conditions')
GROUP BY m.user_id, g.id, c.id, g.name, c.description, c.icd_code;

-- Create a view to get all patient treatments
CREATE VIEW patient_treatments AS
SELECT 
  m.user_id AS patient_id,
  g.id AS variable_id,
  t.id AS treatment_id,
  g.name AS treatment_name,
  t.description,
  t.treatment_type,
  t.manufacturer,
  MAX(m.start_at) AS last_taken_at,
  COUNT(m.id) AS measurement_count
FROM measurements m
JOIN global_variables g ON m.variable_id = g.id
JOIN treatments t ON t.global_variable_id = g.id
WHERE g.variable_category_id = (SELECT id FROM variable_categories WHERE name = 'Treatments')
GROUP BY m.user_id, g.id, t.id, g.name, t.description, t.treatment_type, t.manufacturer;

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conditions_updated_at
  BEFORE UPDATE ON conditions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatments_updated_at
  BEFORE UPDATE ON treatments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_effectiveness_updated_at
  BEFORE UPDATE ON treatment_effectiveness
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_ratings_updated_at
  BEFORE UPDATE ON treatment_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trials_updated_at
  BEFORE UPDATE ON trials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trial_enrollments_updated_at
  BEFORE UPDATE ON trial_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_submissions_updated_at
  BEFORE UPDATE ON data_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for new tables
CREATE TRIGGER update_unit_categories_updated_at
  BEFORE UPDATE ON unit_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variable_categories_updated_at
  BEFORE UPDATE ON variable_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_global_variables_updated_at
  BEFORE UPDATE ON global_variables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_variables_updated_at
  BEFORE UPDATE ON user_variables
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurements_updated_at
  BEFORE UPDATE ON measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_treatment_side_effect_ratings_updated_at
  BEFORE UPDATE ON treatment_side_effect_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_measurements_user_id ON measurements(user_id);
CREATE INDEX idx_measurements_variable_id ON measurements(variable_id);
CREATE INDEX idx_measurements_start_at ON measurements(start_at);
CREATE INDEX idx_user_variables_user_id ON user_variables(user_id);
CREATE INDEX idx_global_variables_category_id ON global_variables(variable_category_id);
CREATE INDEX idx_treatment_side_effect_ratings_user_id ON treatment_side_effect_ratings(user_id);
CREATE INDEX idx_conditions_global_variable_id ON conditions(global_variable_id);
CREATE INDEX idx_treatments_global_variable_id ON treatments(global_variable_id); 