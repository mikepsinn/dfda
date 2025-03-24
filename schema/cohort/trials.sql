-- Create trials table
CREATE TABLE cohort.trials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    status text NOT NULL DEFAULT 'draft',
    oauth_client_id uuid REFERENCES oauth2.clients(id),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid REFERENCES auth.users(id),
    updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE cohort.trials ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Trials are viewable by authenticated users" ON cohort.trials
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Trials are insertable by authenticated users" ON cohort.trials
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Trials are updatable by creators" ON cohort.trials
    FOR UPDATE USING (auth.uid() = created_by); 