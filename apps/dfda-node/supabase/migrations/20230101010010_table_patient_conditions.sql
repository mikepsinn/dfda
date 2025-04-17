-- Migration: create_patient_conditions_table
-- Add user_variable_id and ensure link via trigger

BEGIN;

-- Trigger function to ensure a user_variable exists for the condition
CREATE OR REPLACE FUNCTION public.ensure_user_variable_for_condition()
RETURNS TRIGGER AS $$
DECLARE
  v_user_variable_id UUID;
BEGIN
  -- Check if user_variable exists for this user and condition (global_variable_id)
  SELECT id INTO v_user_variable_id
  FROM public.user_variables
  WHERE user_id = NEW.patient_id
  AND global_variable_id = NEW.condition_id; -- Use condition_id which maps to global_variable_id

  -- If not found, create a basic entry
  IF v_user_variable_id IS NULL THEN
    INSERT INTO public.user_variables (user_id, global_variable_id) -- Only insert essential keys
    VALUES (NEW.patient_id, NEW.condition_id)
    RETURNING id INTO v_user_variable_id;
  END IF;

  -- Assign the found or newly created user_variable_id to the patient_condition row
  NEW.user_variable_id = v_user_variable_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.ensure_user_variable_for_condition() TO authenticated;


-- Create patient_conditions table
CREATE TABLE IF NOT EXISTS public.patient_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  condition_id TEXT NOT NULL REFERENCES public.conditions(id) ON DELETE CASCADE,
  -- Add user_variable_id - it must exist for a patient condition to exist
  user_variable_id UUID NOT NULL REFERENCES public.user_variables(id) ON DELETE RESTRICT,
  diagnosed_at DATE,
  status TEXT CHECK (status IN ('active', 'in_remission', 'resolved')),
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe')),
  notes TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Add a unique constraint to ensure a patient tracks a condition only once via user_variables
  CONSTRAINT unique_patient_user_variable UNIQUE (patient_id, user_variable_id)
);

-- Enable RLS
ALTER TABLE public.patient_conditions ENABLE ROW LEVEL SECURITY;

-- Policies (Example: Allow patient full access to their own conditions)
CREATE POLICY "Allow patient full access to their conditions" ON public.patient_conditions
  FOR ALL
  USING (auth.uid() = patient_id)
  WITH CHECK (auth.uid() = patient_id);

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_conditions TO authenticated;

-- Add indexes
CREATE INDEX idx_patient_conditions_patient_id ON public.patient_conditions(patient_id);
CREATE INDEX idx_patient_conditions_condition_id ON public.patient_conditions(condition_id);
CREATE INDEX idx_patient_conditions_user_variable_id ON public.patient_conditions(user_variable_id);

-- Trigger to ensure user_variable exists before insert
CREATE TRIGGER trigger_ensure_user_variable_before_insert
    BEFORE INSERT ON public.patient_conditions
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_user_variable_for_condition();

-- Trigger for updated_at (Using the correct existing function)
CREATE TRIGGER handle_patient_conditions_updated_at
    BEFORE UPDATE ON public.patient_conditions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); -- Correct function name

COMMIT;