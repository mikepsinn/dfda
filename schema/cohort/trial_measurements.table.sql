-- Table: cohort.trial_measurements

CREATE TABLE cohort.trial_measurements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trial_id uuid REFERENCES cohort.trials(id) ON DELETE CASCADE NOT NULL,
    measurement_id bigint REFERENCES personal.measurements(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id),
    UNIQUE(trial_id, measurement_id)
);
