-- Table to store extracted data points before they're verified and imported
CREATE TABLE IF NOT EXISTS personal.extracted_data_points (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_id uuid NOT NULL REFERENCES personal.data_imports(id) ON DELETE CASCADE,
    data_type text NOT NULL CHECK (data_type IN ('measurement', 'condition', 'medication', 'lab_result', 'receipt')),
    variable_id bigint REFERENCES reference.variables(id) ON DELETE CASCADE,
    extracted_value text NOT NULL,
    parsed_value decimal,
    unit_id VARCHAR(50) REFERENCES reference.units_of_measurement(id) ON DELETE RESTRICT,
    timestamp timestamptz,
    confidence_score decimal CHECK (confidence_score BETWEEN 0 AND 1),
    requires_review boolean DEFAULT false,
    review_status text DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'modified')),
    reviewed_by uuid REFERENCES core.profiles(id) ON DELETE SET NULL,
    review_notes text,
    source_coordinates jsonb, -- Store location in original file (e.g., cell coordinates, PDF coordinates)
    metadata jsonb, -- Additional extracted context
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE personal.extracted_data_points ENABLE ROW LEVEL SECURITY;

-- Users can view extracted data from accessible imports
CREATE POLICY "Users can view extracted data from accessible imports"
    ON personal.extracted_data_points FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM personal.data_imports di
        WHERE di.id = import_id 
        AND di.deleted_at IS NULL
        AND (
            di.user_id = auth.uid() 
            OR di.access_level = 'public'
            OR (
                di.access_level = 'shared' 
                AND (
                    di.shared_with->>'user_ids' ? auth.uid()::text
                    OR EXISTS (
                        SELECT 1 FROM core.user_groups ug
                        WHERE ug.user_id = auth.uid()
                        AND di.shared_with->>'group_ids' ? ug.group_id::text
                    )
                )
            )
        )
    )); 