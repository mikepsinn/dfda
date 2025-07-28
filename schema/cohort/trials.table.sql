-- Table: cohort.trials

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
