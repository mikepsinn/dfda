-- Migration: create_patient_treatments_table
BEGIN;

-- Trigger function to ensure a user_variable exists for the treatment (Simplified)
CREATE OR REPLACE FUNCTION public.ensure_user_variable_for_treatment()
RETURNS TRIGGER AS $$
DECLARE
  v_user_variable_id UUID;
BEGIN
  -- Check if user_variable exists for this user and treatment (global_variable_id)
  SELECT id INTO v_user_variable_id
  FROM public.user_variables
  WHERE user_id = NEW.patient_id
  AND global_variable_id = NEW.treatment_id;

  -- If not found, create a basic entry
  IF v_user_variable_id IS NULL THEN
    -- No need to fetch global variable details anymore
    INSERT INTO public.user_variables (user_id, global_variable_id) -- Only insert essential keys
    VALUES (NEW.patient_id, NEW.treatment_id)
    RETURNING id INTO v_user_variable_id;
  END IF;

  -- Assign the found or newly created user_variable_id to the patient_treatment row
  NEW.user_variable_id = v_user_variable_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function to the authenticated role
GRANT EXECUTE ON FUNCTION public.ensure_user_variable_for_treatment() TO authenticated;

-- Create the patient_treatments table
CREATE TABLE public.patient_treatments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, -- Link to the patient profile
    treatment_id TEXT NOT NULL REFERENCES public.global_treatments(id) ON DELETE RESTRICT, -- Link to the global treatment definition

    -- Add the REQUIRED link to the user_variables table
    user_variable_id UUID NOT NULL REFERENCES public.user_variables(id) ON DELETE RESTRICT,

    start_date TIMESTAMP WITH TIME ZONE, -- When the patient started this course/tracking (can be approx)
    end_date TIMESTAMP WITH TIME ZONE,   -- When the patient stopped (nullable if ongoing)

    -- Status of the patient's usage/tracking
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued', 'considering')),

    -- Indicates if this tracking entry is linked to at least one formal prescription
    is_prescribed BOOLEAN NOT NULL DEFAULT FALSE,

    -- General notes from the patient about their overall experience with this treatment during this period
    patient_notes TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Add the missing unique constraint for the UPSERT
    CONSTRAINT patient_treatments_patient_id_treatment_id_key UNIQUE (patient_id, treatment_id),

    CONSTRAINT check_end_date_after_start_date CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Indexes
CREATE INDEX idx_patient_treatments_patient_id ON public.patient_treatments (patient_id);
CREATE INDEX idx_patient_treatments_treatment_id ON public.patient_treatments (treatment_id);
CREATE INDEX idx_patient_treatments_user_variable_id ON public.patient_treatments (user_variable_id);
CREATE INDEX idx_patient_treatments_status ON public.patient_treatments (status);

-- Row Level Security
ALTER TABLE public.patient_treatments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow patient to manage their own treatment tracking"
    ON public.patient_treatments FOR ALL
    USING (auth.uid() = patient_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_treatments TO authenticated;

-- Comments
COMMENT ON TABLE public.patient_treatments IS 'Tracks a patient''s overall usage or tracking of a specific treatment over a period (prescribed or OTC).';
COMMENT ON COLUMN public.patient_treatments.user_variable_id IS 'Links to the user''s specific tracking entry for this treatment in user_variables. Auto-created if needed.';
COMMENT ON COLUMN public.patient_treatments.status IS 'The current status of the patient''s usage of this treatment (active, inactive, discontinued, considering).';
COMMENT ON COLUMN public.patient_treatments.is_prescribed IS 'Indicates if this treatment tracking entry is associated with one or more formal prescriptions.';
COMMENT ON COLUMN public.patient_treatments.patient_notes IS 'General notes entered by the patient about this treatment during the tracked period.';

-- Trigger to ensure user_variable exists before insert
CREATE TRIGGER trigger_ensure_user_variable_before_insert
    BEFORE INSERT ON public.patient_treatments
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_user_variable_for_treatment();

-- Trigger for updated_at (Assuming function exists)
CREATE TRIGGER handle_patient_treatments_updated_at
    BEFORE UPDATE ON public.patient_treatments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

COMMIT; 