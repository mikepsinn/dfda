-- Variable Synonyms
--
-- Defines alternative names and translations for variables from various sources:
-- * Reference data (official names and translations)
-- * User contributions
-- * Expert knowledge
-- * Aggregated data
--
-- This table supports:
-- * Common alternative names (e.g., "Vitamin C" for "Ascorbic Acid")
-- * Brand names (e.g., "Tylenol" for "Acetaminophen")
-- * Abbreviations (e.g., "BP" for "Blood Pressure")
-- * Translations in different languages
-- * Regional naming variations
--
CREATE TABLE reference.variable_synonyms (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    variable_id bigint NOT NULL REFERENCES reference.variables(id),
    name text NOT NULL,                -- Alternative name or translation
    language_code text NOT NULL DEFAULT 'en',  -- ISO 639-1 language code
    source_type text NOT NULL CHECK (source_type IN ('reference', 'user', 'expert', 'aggregate')),
    source_id bigint,                    -- ID of the user/expert who contributed this
    confidence_score float CHECK (confidence_score >= 0 AND confidence_score <= 1),
    notes text,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(variable_id, name, language_code)
);

-- Enable RLS
ALTER TABLE reference.variable_synonyms ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view synonyms"
    ON reference.variable_synonyms FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert user contributions"
    ON reference.variable_synonyms FOR INSERT
    TO authenticated
    WITH CHECK (source_type = 'user' AND source_id = auth.uid());

CREATE POLICY "Users can update their own contributions"
    ON reference.variable_synonyms FOR UPDATE
    TO authenticated
    USING (source_type = 'user' AND source_id = auth.uid());

COMMENT ON TABLE reference.variable_synonyms IS 'Alternative names and translations for variables from various sources';
COMMENT ON COLUMN reference.variable_synonyms.variable_id IS 'Reference to the canonical variable';
COMMENT ON COLUMN reference.variable_synonyms.name IS 'Alternative name, translation, or abbreviation for the variable';
COMMENT ON COLUMN reference.variable_synonyms.language_code IS 'ISO 639-1 language code (e.g., en, es, fr)';
COMMENT ON COLUMN reference.variable_synonyms.source_type IS 'Origin of the synonym data (reference, user, expert, aggregate)';
COMMENT ON COLUMN reference.variable_synonyms.source_id IS 'ID of the user/expert who contributed this data';
COMMENT ON COLUMN reference.variable_synonyms.confidence_score IS 'Confidence in the accuracy of this synonym (0-1)'; 