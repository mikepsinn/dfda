-- User Lab Results
--
-- User-specific laboratory test results
-- Links to standard lab test types in the reference schema
--
CREATE TABLE personal.user_lab_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES core.profiles(id) ON DELETE CASCADE,
    lab_test_type_id UUID NOT NULL REFERENCES reference.lab_test_types(id),
    value DECIMAL,
    unit_id UUID REFERENCES reference.units_of_measurement(id),
    status VARCHAR(20),
    specimen_type VARCHAR(50),
    collection_at TIMESTAMP WITH TIME ZONE,
    result_at TIMESTAMP WITH TIME ZONE,
    lab_name TEXT,
    notes TEXT,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE personal.user_lab_results ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own lab results"
    ON personal.user_lab_results FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own lab results"
    ON personal.user_lab_results FOR ALL
    USING (auth.uid() = user_id); 