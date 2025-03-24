-- User Treatment Effectiveness Ratings
--
-- Stores user-reported effectiveness ratings for treatments
-- These can be aggregated into global treatment effectiveness statistics
--
CREATE TABLE personal.user_treatment_effectiveness_ratings (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    user_id uuid NOT NULL REFERENCES core.profiles(id),
    treatment_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    condition_variable_id bigint NOT NULL REFERENCES reference.variables(id),
    effectiveness_rating text CHECK (effectiveness_rating IN ('much_worse', 'worse', 'no_effect', 'better', 'much_better')),
    side_effects_rating text CHECK (side_effects_rating IN ('none', 'mild', 'moderate', 'severe', 'intolerable')),
    adherence_rating text CHECK (adherence_rating IN ('never', 'rarely', 'sometimes', 'usually', 'always')),
    cost_rating text CHECK (cost_rating IN ('very_expensive', 'expensive', 'moderate', 'affordable', 'very_affordable')),
    notes text,
    is_public boolean NOT NULL DEFAULT false,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, treatment_variable_id, condition_variable_id)
);

-- Enable RLS
ALTER TABLE personal.user_treatment_effectiveness_ratings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view public ratings"
    ON personal.user_treatment_effectiveness_ratings FOR SELECT
    USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can manage their own ratings"
    ON personal.user_treatment_effectiveness_ratings FOR ALL
    USING (auth.uid() = user_id); 