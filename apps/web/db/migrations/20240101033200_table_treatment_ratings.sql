-- Migration: Define treatment_ratings table linking to patient_treatments AND patient_conditions
BEGIN;

-- Create the table with the new structure
CREATE TABLE public.treatment_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to the specific patient treatment instance being rated
  patient_treatment_id UUID NOT NULL REFERENCES public.patient_treatments(id) ON DELETE CASCADE,

  -- Link to the specific patient_condition record (patient's instance of the condition)
  patient_condition_id UUID NOT NULL REFERENCES public.patient_conditions(id) ON DELETE CASCADE,

  effectiveness_out_of_ten NUMERIC(3, 1), -- Changed from SMALLINT to allow decimals (e.g., 7.5)
  review TEXT,
  helpful_count INT DEFAULT 0,

  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Ensure only one rating per patient_treatment and patient_condition combination
  CONSTRAINT unique_rating_per_patient_treatment_patient_condition UNIQUE (patient_treatment_id, patient_condition_id),

  -- Use named constraint that allows NULL
  CONSTRAINT check_effectiveness_range CHECK (effectiveness_out_of_ten IS NULL OR (effectiveness_out_of_ten >= 0 AND effectiveness_out_of_ten <= 10))
);

-- Add indexes
CREATE INDEX idx_treatment_ratings_patient_treatment
ON public.treatment_ratings(patient_treatment_id);
CREATE INDEX idx_treatment_ratings_patient_condition -- Updated index
ON public.treatment_ratings(patient_condition_id);

-- Comments
COMMENT ON TABLE public.treatment_ratings IS 'Stores user effectiveness ratings and reviews for specific treatment periods (patient_treatments) FOR specific patient condition instances.';
COMMENT ON COLUMN public.treatment_ratings.patient_treatment_id IS 'Links to the specific patient treatment instance being rated.';
COMMENT ON COLUMN public.treatment_ratings.patient_condition_id IS 'Links to the patient''s specific record of having the condition for which effectiveness is rated.';
COMMENT ON COLUMN public.treatment_ratings.effectiveness_out_of_ten IS 'User effectiveness rating from 0 (none) to 10 (very effective). Allows for one decimal place.';
COMMENT ON COLUMN public.treatment_ratings.review IS 'User textual review of their experience during the treatment period for the specified condition instance.';

-- Row Level Security
ALTER TABLE public.treatment_ratings ENABLE ROW LEVEL SECURITY;

-- Allow patient to manage ratings linked to their treatments/conditions
CREATE POLICY "Allow patient manage ratings for their treatments/conditions"
  ON public.treatment_ratings FOR ALL
  USING (EXISTS (
      -- Check ownership via patient_treatments
      SELECT 1 FROM public.patient_treatments pt
      WHERE pt.id = treatment_ratings.patient_treatment_id AND pt.patient_id = auth.uid()
  ) AND EXISTS (
      -- Check ownership via patient_conditions (might be redundant if first check is sufficient, but safer)
      SELECT 1 FROM public.patient_conditions pc
      WHERE pc.id = treatment_ratings.patient_condition_id AND pc.patient_id = auth.uid()
  ));

-- Allow authenticated users to view ratings (adjust for privacy if needed)
CREATE POLICY "Allow authenticated read access to ratings" 
  ON public.treatment_ratings FOR SELECT
  USING (auth.role() = 'authenticated');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.treatment_ratings TO authenticated;

-- Trigger for updated_at (Assuming function exists)
CREATE TRIGGER handle_treatment_ratings_updated_at
    BEFORE UPDATE ON public.treatment_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.set_current_timestamp_updated_at();

COMMIT;