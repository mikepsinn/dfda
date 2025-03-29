-- Enable RLS on patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Create policies for patients
CREATE POLICY "Patients can view own record"
  ON patients FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Doctors can view enrolled patients"
  ON patients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trial_enrollments te
    WHERE te.patient_id = patients.id
    AND te.doctor_id = auth.uid()
    AND te.deleted_at IS NULL
  ));

CREATE POLICY "Patients can update own record"
  ON patients FOR UPDATE
  USING (auth.uid() = id);