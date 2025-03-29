-- Enable RLS
ALTER TABLE protocol_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_actions ENABLE ROW LEVEL SECURITY;

-- Protocol versions policies
CREATE POLICY "Admins can do everything on protocol_versions"
ON protocol_versions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);

CREATE POLICY "Sponsors can view and edit their trial protocols"
ON protocol_versions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trials t
    WHERE t.id = protocol_versions.trial_id
    AND t.sponsor_id = auth.uid()
  )
);

CREATE POLICY "Doctors can view protocols for their trials"
ON protocol_versions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trial_enrollments e
    WHERE e.trial_id = protocol_versions.trial_id
    AND e.doctor_id = auth.uid()
  )
);

-- Action types policies
CREATE POLICY "Everyone can view action types"
ON action_types FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Only admins can modify action types"
ON action_types FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);

-- Trial actions policies
CREATE POLICY "Admins can do everything on trial_actions"
ON trial_actions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND user_type = 'admin'
  )
);

CREATE POLICY "Doctors can view and modify their trial actions"
ON trial_actions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trial_enrollments e
    WHERE e.id = trial_actions.enrollment_id
    AND e.doctor_id = auth.uid()
  )
);

CREATE POLICY "Sponsors can view actions for their trials"
ON trial_actions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trials t
    WHERE t.id = trial_actions.trial_id
    AND t.sponsor_id = auth.uid()
  )
);

CREATE POLICY "Patients can view their own actions"
ON trial_actions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM trial_enrollments e
    WHERE e.id = trial_actions.enrollment_id
    AND e.patient_id = auth.uid()
  )
); 