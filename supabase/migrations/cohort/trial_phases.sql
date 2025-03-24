-- Create trial phases table
CREATE TABLE cohort.trial_phases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trial_id uuid REFERENCES cohort.trials(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    sequence_order integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
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

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON cohort.trial_phases
    FOR EACH ROW
    EXECUTE FUNCTION common.set_updated_at(); 