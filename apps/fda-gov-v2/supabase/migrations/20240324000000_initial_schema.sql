-- Create tables
CREATE TABLE IF NOT EXISTS conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icd_code TEXT,
  global_variable_id UUID, -- Will be linked to global_variables
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Direct patient-condition relationship table
CREATE TABLE IF NOT EXISTS patient_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  condition_id UUID NOT NULL REFERENCES conditions(id) ON DELETE CASCADE,
  diagnosing_doctor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  diagnosis_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE, -- For conditions that have been resolved
  notes TEXT,
  severity TEXT, -- mild, moderate, severe, etc.
  status TEXT NOT NULL DEFAULT 'active', -- active, resolved, in_remission, etc.
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_patient_condition UNIQUE (patient_id, condition_id) 
    WHERE deleted_at IS NULL AND end_date IS NULL
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_variable UNIQUE (user_id, variable_id) 
    WHERE deleted_at IS NULL
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- reminder, alert, info, etc.
  related_entity_type TEXT, -- condition, treatment, measurement, etc.
  related_entity_id UUID, -- ID of the related entity
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL, -- When to show the notification
  expires_at TIMESTAMP WITH TIME ZONE, -- When the notification expires
  action_url TEXT, -- URL to navigate to when notification is clicked
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_treatment_side_effect UNIQUE (user_id, treatment_id, side_effect_variable_id)
    WHERE deleted_at IS NULL
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Anyone can view doctor profiles"
  ON profiles FOR SELECT
  USING (user_type = 'doctor' AND deleted_at IS NULL);

CREATE POLICY "Anyone can view sponsor profiles"
  ON profiles FOR SELECT
  USING (user_type = 'sponsor' AND deleted_at IS NULL);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Enable RLS on key tables
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_side_effect_ratings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for measurements
CREATE POLICY "Users can select own measurements"
  ON measurements FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own measurements"
  ON measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own measurements"
  ON measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own measurements"
  ON measurements FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for user_variables
CREATE POLICY "Users can select own user_variables"
  ON user_variables FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own user_variables"
  ON user_variables FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own user_variables"
  ON user_variables FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own user_variables"
  ON user_variables FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for patient_conditions
CREATE POLICY "Patients can select own conditions"
  ON patient_conditions FOR SELECT
  USING (auth.uid() = patient_id AND deleted_at IS NULL);

CREATE POLICY "Doctors can select their patients' conditions"
  ON patient_conditions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'doctor' AND deleted_at IS NULL
    ) AND deleted_at IS NULL
  );

CREATE POLICY "Patients can insert own conditions"
  ON patient_conditions FOR INSERT
  WITH CHECK (auth.uid() = patient_id);

CREATE POLICY "Doctors can insert patient conditions"
  ON patient_conditions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'doctor' AND deleted_at IS NULL
    )
  );

CREATE POLICY "Patients can update own conditions"
  ON patient_conditions FOR UPDATE
  USING (auth.uid() = patient_id);

CREATE POLICY "Doctors can update patient conditions"
  ON patient_conditions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND user_type = 'doctor' AND deleted_at IS NULL
    )
  );

-- Create RLS policies for notifications
CREATE POLICY "Users can select own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Create RLS policies for treatment_side_effect_ratings
CREATE POLICY "Users can select own treatment_side_effect_ratings"
  ON treatment_side_effect_ratings FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own treatment_side_effect_ratings"
  ON treatment_side_effect_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treatment_side_effect_ratings"
  ON treatment_side_effect_ratings FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for profiles
CREATE INDEX profiles_user_type_idx ON profiles(user_type);
CREATE INDEX profiles_email_idx ON profiles(email);
CREATE INDEX profiles_deleted_at_idx ON profiles(deleted_at) WHERE deleted_at IS NOT NULL;

-- Function for soft delete and restore
CREATE OR REPLACE FUNCTION soft_delete_record(p_table_name TEXT, p_record_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_sql TEXT;
  v_result BOOLEAN;
BEGIN
  v_sql := 'UPDATE ' || quote_ident(p_table_name) || 
           ' SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL';
  
  EXECUTE v_sql USING p_record_id;
  
  GET DIAGNOSTICS v_result = ROW_COUNT;
  
  RETURN v_result > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION restore_soft_deleted_record(p_table_name TEXT, p_record_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_sql TEXT;
  v_result BOOLEAN;
BEGIN
  v_sql := 'UPDATE ' || quote_ident(p_table_name) || 
           ' SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL';
  
  EXECUTE v_sql USING p_record_id;
  
  GET DIAGNOSTICS v_result = ROW_COUNT;
  
  RETURN v_result > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
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
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default variable categories
INSERT INTO variable_categories (name, description, emoji) VALUES 
('Conditions', 'Medical conditions and diagnoses', '🩺'),
('Treatments', 'Medications and other medical treatments', '💊'),
('Symptoms', 'Patient-reported symptoms', '🤒'),
('Side Effects', 'Adverse effects from treatments', '⚠️'),
('Foods', 'Food and nutrition intake', '🍎'),
('Vital Signs', 'Medical vital measurements', '❤️');

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
  AND condition_id = p_condition_id
  AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_helpful_count(p_rating_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE treatment_ratings
  SET helpful_count = helpful_count + 1
  WHERE id = p_rating_id
  AND deleted_at IS NULL;
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
CREATE VIEW patient_conditions_view AS
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
AND m.deleted_at IS NULL
AND g.deleted_at IS NULL
AND c.deleted_at IS NULL
GROUP BY m.user_id, g.id, c.id, g.name, c.description, c.icd_code;

-- Create a view to get all patient treatments
CREATE VIEW patient_treatments_view AS
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
AND m.deleted_at IS NULL
AND g.deleted_at IS NULL
AND t.deleted_at IS NULL
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

CREATE TRIGGER update_patient_conditions_updated_at
  BEFORE UPDATE ON patient_conditions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_measurements_user_id ON measurements(user_id);
CREATE INDEX idx_measurements_variable_id ON measurements(variable_id);
CREATE INDEX idx_measurements_start_at ON measurements(start_at);
CREATE INDEX idx_measurements_deleted_at ON measurements(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_user_variables_user_id ON user_variables(user_id);
CREATE INDEX idx_user_variables_deleted_at ON user_variables(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_global_variables_category_id ON global_variables(variable_category_id);
CREATE INDEX idx_global_variables_deleted_at ON global_variables(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_treatment_side_effect_ratings_user_id ON treatment_side_effect_ratings(user_id);
CREATE INDEX idx_treatment_side_effect_ratings_deleted_at ON treatment_side_effect_ratings(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_conditions_global_variable_id ON conditions(global_variable_id);
CREATE INDEX idx_conditions_deleted_at ON conditions(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_treatments_global_variable_id ON treatments(global_variable_id);
CREATE INDEX idx_treatments_deleted_at ON treatments(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_patient_conditions_patient_id ON patient_conditions(patient_id);
CREATE INDEX idx_patient_conditions_condition_id ON patient_conditions(condition_id);
CREATE INDEX idx_patient_conditions_status ON patient_conditions(status);
CREATE INDEX idx_patient_conditions_deleted_at ON patient_conditions(deleted_at) WHERE deleted_at IS NOT NULL;

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_is_read ON notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_deleted_at ON notifications(deleted_at) WHERE deleted_at IS NOT NULL; 