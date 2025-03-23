-- User Conditions
--
-- User-specific medical conditions and diagnoses
-- Links to standard condition variables in the reference schema
--
CREATE TABLE personal.user_conditions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    condition_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    onset_at timestamptz NOT NULL,
    resolution_at timestamptz,
    status text NOT NULL CHECK (status IN ('active', 'resolved', 'recurring')),
    severity integer CHECK (severity BETWEEN 1 AND 5),
    notes text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, condition_variable_id, onset_at)
);

-- Enable RLS
ALTER TABLE personal.user_conditions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own conditions"
    ON personal.user_conditions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own conditions"
    ON personal.user_conditions FOR ALL
    USING (auth.uid() = user_id); 