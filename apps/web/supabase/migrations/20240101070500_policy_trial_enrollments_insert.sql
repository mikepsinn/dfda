-- supabase/migrations/<timestamp>_policy_trial_enrollments_insert.sql

-- Allow authenticated users (patients) to insert their own enrollment record.
CREATE POLICY "Patients can create own enrollments"
  ON public.trial_enrollments FOR INSERT
  WITH CHECK (patient_id = auth.uid()); 