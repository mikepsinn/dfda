-- Table: personal.user_conditions

CREATE TABLE personal.user_conditions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    condition_variable_id bigint NOT NULL REFERENCES reference.variables(id),
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
