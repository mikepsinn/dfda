-- Seed data for citations table

-- Placeholder citation for Atorvastatin data (mimicking OutcomeLabelsSection example)
INSERT INTO citations (id, type, title, journal_or_publisher, publication_year, url, retrieved_at)
VALUES 
  ('cite-atorvastatin-example', 'other', 'Aggregated Atorvastatin 20mg Outcome Data Example', 'Hypothetical Meta-Analysis Inc.', 2025, 'https://example.com/atorvastatin-summary', '2025-02-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;


-- Placeholder citation for Klotho Gene Therapy data (mimicking Step2ViewOutcomeLabels example)
INSERT INTO citations (id, type, title, journal_or_publisher, publication_year, url, retrieved_at)
VALUES 
  ('cite-klotho-therapy-example', 'other', 'Sample Klotho Gene Therapy Outcome Data', 'Fictional Biotech Trials', 2024, 'https://example.com/klotho-trial-results', '2024-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING; 