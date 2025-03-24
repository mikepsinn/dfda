-- Create trial arms table
CREATE TABLE cohort.trial_arms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    trial_id uuid REFERENCES cohort.trials(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    description text,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE cohort.trial_arms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Trial arms are viewable by authenticated users" ON cohort.trial_arms
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Trial arms are insertable by trial creators" ON cohort.trial_arms
    FOR INSERT WITH CHECK (
        auth.uid() IN (
            SELECT created_by 
            FROM cohort.trials 
            WHERE id = trial_id
        )
    );

CREATE POLICY "Trial arms are updatable by trial creators" ON cohort.trial_arms
    FOR UPDATE USING (
        auth.uid() IN (
            SELECT created_by 
            FROM cohort.trials 
            WHERE id = trial_id
        )
    );

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON cohort.trial_arms
    FOR EACH ROW
    EXECUTE FUNCTION common.set_updated_at(); 