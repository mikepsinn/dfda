-- Migration: create_patient_treatments_table
BEGIN;

-- Trigger function to ensure a user_variable exists for the treatment
CREATE OR REPLACE FUNCTION public.ensure_user_variable_for_treatment()
RETURNS TRIGGER AS $$
DECLARE
  v_user_variable_id UUID;
  v_treatment_name TEXT;
  v_variable_category_id TEXT;
  v_unit_category_id TEXT;
  v_emoji TEXT;
  v_image_url TEXT;
  v_description TEXT;
BEGIN
  -- Check if user_variable exists for this user and treatment (global_variable_id)
  SELECT id INTO v_user_variable_id
  FROM public.user_variables
  WHERE user_id = NEW.patient_id
  AND global_variable_id = NEW.treatment_id;

  -- If not found, create it
  IF v_user_variable_id IS NULL THEN
    -- Fetch details from the global variable (treatment) to populate user_variable
    SELECT gv.name, gv.variable_category_id, u.unit_category_id, gv.emoji, gv.image_url, gv.description
    INTO v_treatment_name, v_variable_category_id, v_unit_category_id, v_emoji, v_image_url, v_description
    FROM public.global_variables gv
    LEFT JOIN public.units u ON gv.default_unit_id = u.id -- Join to get unit category
    WHERE gv.id = NEW.treatment_id;

    -- If global variable details aren't found, raise an error (shouldn't happen with FKs)
    IF v_treatment_name IS NULL THEN
       RAISE EXCEPTION 'Treatment global variable not found for id %', NEW.treatment_id;
    END IF;

    INSERT INTO public.user_variables (user_id, global_variable_id, name, variable_category_id, unit_category_id, emoji, image_url, description)
    VALUES (NEW.patient_id, NEW.treatment_id, v_treatment_name, v_variable_category_id, v_unit_category_id, v_emoji, v_image_url, v_description)
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
    treatment_id TEXT NOT NULL REFERENCES public.treatments(id) ON DELETE RESTRICT, -- Link to the global treatment definition

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