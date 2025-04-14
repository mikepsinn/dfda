-- Enable RLS on trials
ALTER TABLE trials ENABLE ROW LEVEL SECURITY;

-- Create policies for trials
CREATE POLICY "Anyone can view active trials"
  ON trials FOR SELECT
  USING (status IN ('recruiting', 'pending_approval') AND deleted_at IS NULL);

CREATE POLICY "Sponsors can view own trials"
  ON trials FOR SELECT
  USING (research_partner_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Sponsors can update own trials"
  ON trials FOR UPDATE
  USING (research_partner_id = auth.uid());

CREATE POLICY "Sponsors can delete own trials"
  ON trials FOR DELETE
  USING (research_partner_id = auth.uid());

-- Enable RLS on trial_enrollments
ALTER TABLE trial_enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for trial_enrollments
CREATE POLICY "Patients can view own enrollments"
  ON trial_enrollments FOR SELECT
  USING (patient_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Providers can view their trial enrollments"
  ON trial_enrollments FOR SELECT
  USING (provider_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Sponsors can view enrollments for their trials"
  ON trial_enrollments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trials t
    WHERE t.id = trial_enrollments.trial_id
    AND t.research_partner_id = auth.uid()
    AND t.deleted_at IS NULL
  ));

CREATE POLICY "Providers can update their trial enrollments"
  ON trial_enrollments FOR UPDATE
  USING (provider_id = auth.uid());

-- Add INSERT policy
CREATE POLICY "Users can create own enrollments or enrollments they provide"
  ON trial_enrollments FOR INSERT
  WITH CHECK (auth.uid() = patient_id OR auth.uid() = provider_id);