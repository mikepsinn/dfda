-- Migration: create_patient_symptoms_table
-- Add user_variable_id and ensure link via trigger

BEGIN;

-- Trigger function to ensure a user_variable exists for the symptom
CREATE OR REPLACE FUNCTION public.ensure_user_variable_for_symptom()
RETURNS TRIGGER AS $$
DECLARE
  v_user_variable_id UUID;
BEGIN
  -- Check if user_variable exists for this user and symptom (global_variable_id)
  SELECT id INTO v_user_variable_id
  FROM public.user_variables
  WHERE user_id = NEW.patient_id
  AND global_variable_id = NEW.symptom_id; -- Use symptom_id which maps to global_variable_id

  -- If not found, create a basic entry
  IF v_user_variable_id IS NULL THEN
    INSERT INTO public.user_variables (user_id, global_variable_id) -- Only insert essential keys
    VALUES (NEW.patient_id, NEW.symptom_id)
    RETURNING id INTO v_user_variable_id;
  END IF;

  -- Assign the found or newly created user_variable_id to the patient_symptom row
  NEW.user_variable_id = v_user_variable_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.ensure_user_variable_for_symptom() TO authenticated;


-- Create patient_symptoms table
CREATE TABLE IF NOT EXISTS public.patient_symptoms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  symptom_id TEXT NOT NULL REFERENCES public.global_symptoms(id) ON DELETE CASCADE,
  -- Add user_variable_id - it must exist for a patient symptom to exist
  user_variable_id UUID NOT NULL REFERENCES public.user_variables(id) ON DELETE RESTRICT,
  onset_date DATE,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'unknown')), -- Added 'unknown'
  frequency TEXT, -- e.g., 'daily', 'weekly', 'intermittent'
  notes TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Add a unique constraint to ensure a patient tracks a symptom only once via user_variables
  CONSTRAINT unique_patient_symptom_user_variable UNIQUE (patient_id, user_variable_id)
);

-- Enable RLS
ALTER TABLE public.patient_symptoms ENABLE ROW LEVEL SECURITY;

-- Policies (Example: Allow patient full access to their own symptoms)
CREATE POLICY "Allow patient full access to their symptoms" ON public.patient_symptoms
  FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_symptoms TO authenticated;

-- Add indexes
CREATE INDEX idx_patient_symptoms_patient_id ON public.patient_symptoms(patient_id);
CREATE INDEX idx_patient_symptoms_symptom_id ON public.patient_symptoms(symptom_id);
CREATE INDEX idx_patient_symptoms_user_variable_id ON public.patient_symptoms(user_variable_id);

-- Trigger to ensure user_variable exists before insert
CREATE TRIGGER trigger_ensure_user_variable_for_symptom_before_insert
    BEFORE INSERT ON public.patient_symptoms
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_user_variable_for_symptom();

-- Trigger for updated_at (Assuming a generic function exists, like the one for patient_conditions)
CREATE TRIGGER handle_patient_symptoms_updated_at
    BEFORE UPDATE ON public.patient_symptoms
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); -- Ensure this function exists

COMMIT; 