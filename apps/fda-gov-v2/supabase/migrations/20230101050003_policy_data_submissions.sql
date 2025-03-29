-- Enable RLS on data_submissions
ALTER TABLE data_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies for data_submissions
CREATE POLICY "Patients can view own submissions"
  ON data_submissions FOR SELECT
  USING (patient_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Doctors can view submissions for their enrollments"
  ON data_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trial_enrollments te
    WHERE te.id = data_submissions.enrollment_id
    AND te.doctor_id = auth.uid()
    AND te.deleted_at IS NULL
  ));

CREATE POLICY "Sponsors can view submissions for their trials"
  ON data_submissions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trial_enrollments te
    JOIN trials t ON t.id = te.trial_id
    WHERE te.id = data_submissions.enrollment_id
    AND t.sponsor_id = auth.uid()
    AND t.deleted_at IS NULL
  ));

CREATE POLICY "Patients can create own submissions"
  ON data_submissions FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors can review submissions"
  ON data_submissions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM trial_enrollments te
    WHERE te.id = data_submissions.enrollment_id
    AND te.doctor_id = auth.uid()
    AND te.deleted_at IS NULL
  )); 