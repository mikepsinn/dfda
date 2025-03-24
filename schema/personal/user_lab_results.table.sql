-- Table: personal.user_lab_results

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
