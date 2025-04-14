-- Migration: Define reported_side_effects table linking to patient_treatments
BEGIN;

CREATE TABLE public.reported_side_effects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the specific patient treatment instance
  patient_treatment_id UUID NOT NULL REFERENCES public.patient_treatments(id) ON DELETE CASCADE,

  description TEXT NOT NULL,
  severity_out_of_ten NUMERIC(3, 1) CHECK (severity_out_of_ten BETWEEN 0 AND 10),

  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups by patient treatment
CREATE INDEX idx_reported_side_effects_patient_treatment
ON public.reported_side_effects(patient_treatment_id);

-- Comments
COMMENT ON TABLE public.reported_side_effects IS 'Stores side effects reported by users for specific treatment periods.';
COMMENT ON COLUMN public.reported_side_effects.patient_treatment_id IS 'Links to the specific patient treatment instance during which the side effect was reported.';
COMMENT ON COLUMN public.reported_side_effects.severity_out_of_ten IS 'User-reported severity rating from 0 (none) to 10 (severe).';

-- Row Level Security
ALTER TABLE public.reported_side_effects ENABLE ROW LEVEL SECURITY;

-- Allow patient to manage side effects linked to their treatments
CREATE POLICY "Allow patient manage side effects for their treatments"
  ON public.reported_side_effects FOR ALL
  USING (EXISTS (
      SELECT 1 FROM public.patient_treatments pt
      WHERE pt.id = reported_side_effects.patient_treatment_id AND pt.patient_id = auth.uid()
  ));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reported_side_effects TO authenticated;

-- Trigger for updated_at (Assuming function exists)
CREATE TRIGGER handle_reported_side_effects_updated_at
    BEFORE UPDATE ON public.reported_side_effects
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

COMMIT;
