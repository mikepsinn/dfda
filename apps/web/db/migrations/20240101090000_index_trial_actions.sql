-- Add indexes for better query performance
CREATE INDEX idx_trial_actions_status ON trial_actions(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_trial_actions_due_date ON trial_actions(due_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_trial_actions_enrollment ON trial_actions(enrollment_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_trial_actions_composite ON trial_actions(trial_id, status, due_date) WHERE deleted_at IS NULL;

CREATE INDEX idx_protocol_versions_trial ON protocol_versions(trial_id, status, version_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_protocol_versions_status ON protocol_versions(status) WHERE deleted_at IS NULL; 