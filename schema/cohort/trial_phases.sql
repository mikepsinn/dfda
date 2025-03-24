-- Create trial phases table
CREATE TABLE cohort.trial_phases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trial_id uuid REFERENCES cohort.trials(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    sequence_order integer NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE cohort.trial_phases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Trial phases are viewable by authenticated users" ON cohort.trial_phases
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Trial phases are insertable by trial creators" ON cohort.trial_phases
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT created_by 
            FROM cohort.trials 
            WHERE id = trial_id
        )
    );

CREATE POLICY "Trial phases are updatable by trial creators" ON cohort.trial_phases
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT created_by 
            FROM cohort.trials 
            WHERE id = trial_id
        )
    ); 