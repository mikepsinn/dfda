-- Table: models.parameter_sources

CREATE TABLE models.parameter_sources (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    parameter_set_id bigint REFERENCES models.parameter_sets(id),
    intervention_effect_id bigint REFERENCES models.intervention_effects(id),
    source_type text NOT NULL CHECK (source_type IN ('paper', 'dataset', 'expert_opinion', 'meta_analysis', 'clinical_trial', 'other')),
    citation text NOT NULL,
    url text,
    doi text,
    publication_date date,
    authors text[],
    quality_score numeric CHECK (quality_score BETWEEN 0 AND 1),
    methodology_notes text,
    limitations text,
    metadata jsonb,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT parameter_source_reference CHECK (
        (parameter_set_id IS NOT NULL AND intervention_effect_id IS NULL) OR
        (parameter_set_id IS NULL AND intervention_effect_id IS NOT NULL)
    )
);
