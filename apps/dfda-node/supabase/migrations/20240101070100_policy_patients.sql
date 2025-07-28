-- Enable RLS for patients table
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own patient record
CREATE POLICY "Users can view own patient record"
  ON patients FOR SELECT
  USING (auth.uid() = id);

-- Allow users to insert their own patient record
-- This is needed for the upsert in seedDemoUserData if the trigger didn't create it
CREATE POLICY "Users can insert own patient record"
  ON patients FOR INSERT
  WITH CHECK (auth.uid() = id);
  
-- Allow users to update their own patient record
-- This is needed for the upsert in seedDemoUserData
CREATE POLICY "Users can update own patient record"
  ON patients FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policies for patients
CREATE POLICY "Patients can view own record"
  ON patients FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Providers can view enrolled patients"
  ON patients FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM trial_enrollments te
    WHERE te.patient_id = patients.id
    AND te.provider_id = auth.uid()
    AND te.deleted_at IS NULL
  ));

CREATE POLICY "Patients can update own record"
  ON patients FOR UPDATE
  USING (auth.uid() = id);