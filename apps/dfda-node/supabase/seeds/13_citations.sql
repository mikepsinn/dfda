-- Seed data for citations table

-- Placeholder citation for Atorvastatin data (mimicking OutcomeLabelsSection example)
INSERT INTO citations (id, type, title, journal_or_publisher, publication_year, url, retrieved_at, aggregate_trial_count, aggregate_participant_count)
VALUES 
  ('cite-atorvastatin-example', 'other', 'Aggregated Atorvastatin 20mg Outcome Data Example', 'Hypothetical Meta-Analysis Inc.', 2025, 'https://example.com/atorvastatin-summary', '2025-02-01T00:00:00Z', 42, 48500)
ON CONFLICT (id) DO UPDATE SET -- Use DO UPDATE to ensure new columns are set if row exists
  aggregate_trial_count = EXCLUDED.aggregate_trial_count,
  aggregate_participant_count = EXCLUDED.aggregate_participant_count;


-- Placeholder citation for Klotho Gene Therapy data (mimicking Step2ViewOutcomeLabels example)
INSERT INTO citations (id, type, title, journal_or_publisher, publication_year, url, retrieved_at, aggregate_trial_count, aggregate_participant_count)
VALUES 
  ('cite-klotho-therapy-example', 'other', 'Sample Klotho Gene Therapy Outcome Data', 'Fictional Biotech Trials', 2024, 'https://example.com/klotho-trial-results', '2024-01-01T00:00:00Z', 1, 150) -- Example counts
ON CONFLICT (id) DO UPDATE SET 
  aggregate_trial_count = EXCLUDED.aggregate_trial_count,
  aggregate_participant_count = EXCLUDED.aggregate_participant_count; 