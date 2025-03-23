-- User External Treatment Effectiveness Ratings
--
-- Stores treatment effectiveness ratings imported from external sources
-- These are linked to specific users but may come from third-party data
--
CREATE TABLE personal.user_external_treatment_effectiveness_ratings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    treatment_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    condition_variable_id bigint NOT NULL REFERENCES reference.global_variables(id),
    source_type text NOT NULL CHECK (source_type IN ('doctor', 'research', 'anecdotal')),
    source_name text,
    source_url text,
    effectiveness_rating text CHECK (effectiveness_rating IN ('much_worse', 'worse', 'no_effect', 'better', 'much_better')),
    side_effects_rating text CHECK (side_effects_rating IN ('none', 'mild', 'moderate', 'severe', 'intolerable')),
    confidence_level text CHECK (confidence_level IN ('low', 'medium', 'high')),
    notes text,
    is_public boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, treatment_variable_id, condition_variable_id, source_type, source_name)
);

-- Enable RLS
ALTER TABLE personal.user_external_treatment_effectiveness_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view public external ratings"
    ON personal.user_external_treatment_effectiveness_ratings FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own external ratings"
    ON personal.user_external_treatment_effectiveness_ratings FOR ALL
    USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_external_ratings_treatment 
    ON personal.user_external_treatment_effectiveness_ratings(treatment_variable_id);
    
CREATE INDEX idx_external_ratings_condition 
    ON personal.user_external_treatment_effectiveness_ratings(condition_variable_id);
    
CREATE INDEX idx_external_ratings_data_source 
    ON personal.user_external_treatment_effectiveness_ratings(source_type);

CREATE INDEX idx_external_ratings_effectiveness 
    ON personal.user_external_treatment_effectiveness_ratings(effectiveness_rating);

CREATE INDEX idx_external_ratings_study_quality 
    ON personal.user_external_treatment_effectiveness_ratings(confidence_level); 