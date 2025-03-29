-- Function to generate actions from protocol schedule
CREATE OR REPLACE FUNCTION generate_protocol_actions(
  enrollment_id UUID,
  protocol_version_id UUID DEFAULT NULL
)
RETURNS SETOF trial_actions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trial_id UUID;
  v_patient_id UUID;
  v_doctor_id UUID;
  v_protocol protocol_versions;
  v_schedule JSONB;
  v_action JSONB;
BEGIN
  -- Get enrollment details
  SELECT 
    e.trial_id,
    e.patient_id,
    e.doctor_id
  INTO v_trial_id, v_patient_id, v_doctor_id
  FROM trial_enrollments e
  WHERE e.id = enrollment_id;

  -- Get latest protocol version if not specified
  IF protocol_version_id IS NULL THEN
    SELECT *
    INTO v_protocol
    FROM protocol_versions
    WHERE trial_id = v_trial_id
      AND status = 'approved'
    ORDER BY version_number DESC
    LIMIT 1;
  ELSE
    SELECT *
    INTO v_protocol
    FROM protocol_versions
    WHERE id = protocol_version_id;
  END IF;

  -- Generate actions for each required action in the schedule
  FOR v_schedule IN SELECT * FROM jsonb_array_elements(v_protocol.schedule)
  LOOP
    FOR v_action IN SELECT * FROM jsonb_array_elements(v_schedule->>'required_actions')
    LOOP
      RETURN NEXT (
        INSERT INTO trial_actions (
          trial_id,
          protocol_version_id,
          enrollment_id,
          action_type_id,
          title,
          description,
          status,
          due_date,
          is_protocol_required
        ) VALUES (
          v_trial_id,
          v_protocol.id,
          enrollment_id,
          (v_action->>'action_type_id')::UUID,
          v_action->>'title',
          v_action->>'description',
          'pending',
          (v_schedule->>'target_date')::TIMESTAMP WITH TIME ZONE,
          true
        )
        RETURNING *
      );
    END LOOP;
  END LOOP;

  RETURN;
END;
$$; 