-- Trial Measurements linking table
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

-- Enable RLS
ALTER TABLE cohort.trial_measurements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Trial measurements are viewable by trial participants and creators" ON cohort.trial_measurements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM personal.measurements m
            JOIN cohort.trials_participants tp ON m.user_id = tp.user_id
            WHERE m.id = measurement_id
            AND tp.trial_id = trial_id
        ) OR
        EXISTS (
            SELECT 1 FROM cohort.trials t
            WHERE t.id = trial_id
            AND t.created_by = auth.uid()
        )
    );

CREATE POLICY "Trial measurements are insertable by trial creators" ON cohort.trial_measurements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM cohort.trials t
            WHERE t.id = trial_id
            AND t.created_by = auth.uid()
        )
    ); 