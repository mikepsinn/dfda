-- Seed data for global_variable_relationships table

-- ==========================================================================
-- Atorvastatin 20mg Example (from OutcomeLabelsSection.tsx)
-- ==========================================================================
-- Assumes:
-- predictor_global_variable_id: 'atorvastatin-20mg'
-- citation_id: 'cite-atorvastatin-example'
-- unit_ids: 'milligrams-per-deciliter', 'percent'
-- outcome_global_variable_ids: 'ldl-cholesterol', 'total-cholesterol', 'cv-event-risk', 'hdl-cholesterol', 'triglycerides', 'muscle-pain', 'liver-enzyme-elevation', 'headache'

-- Primary Outcomes
INSERT INTO global_variable_relationships
  (predictor_global_variable_id, outcome_global_variable_id, citation_id, category, category_display_order, item_display_order, baseline_description, percentage_change, absolute_change_value, absolute_change_unit_id, is_positive_outcome)
VALUES
  ('atorvastatin-20mg', 'ldl-cholesterol', 'cite-atorvastatin-example', 'Primary Outcomes', 1, 1, '(baseline: 160 mg/dL)', -43, -69, 'milligrams-per-deciliter', true),
  ('atorvastatin-20mg', 'total-cholesterol', 'cite-atorvastatin-example', 'Primary Outcomes', 1, 2, '(baseline: 240 mg/dL)', -32, -77, 'milligrams-per-deciliter', true),
  ('atorvastatin-20mg', 'cv-event-risk', 'cite-atorvastatin-example', 'Primary Outcomes', 1, 3, '(10-year risk)', -36, -4.2, 'percent', true);

-- Secondary Benefits
INSERT INTO global_variable_relationships
  (predictor_global_variable_id, outcome_global_variable_id, citation_id, category, category_display_order, item_display_order, percentage_change, absolute_change_value, absolute_change_unit_id, is_positive_outcome)
VALUES
  ('atorvastatin-20mg', 'hdl-cholesterol', 'cite-atorvastatin-example', 'Secondary Benefits', 2, 1, 5, 2.3, 'milligrams-per-deciliter', true),
  ('atorvastatin-20mg', 'triglycerides', 'cite-atorvastatin-example', 'Secondary Benefits', 2, 2, -22, -35, 'milligrams-per-deciliter', true);

-- Side Effects
INSERT INTO global_variable_relationships
  (predictor_global_variable_id, outcome_global_variable_id, citation_id, category, category_display_order, item_display_order, baseline_description, percentage_change, nnh, is_positive_outcome)
VALUES
  ('atorvastatin-20mg', 'muscle-pain', 'cite-atorvastatin-example', 'Side Effects', 3, 1, '(vs. placebo)', 8.2, 12, false),
  ('atorvastatin-20mg', 'liver-enzyme-elevation', 'cite-atorvastatin-example', 'Side Effects', 3, 2, NULL, 1.2, 83, false),
  ('atorvastatin-20mg', 'headache', 'cite-atorvastatin-example', 'Side Effects', 3, 3, NULL, 3.8, 26, false);


-- ==========================================================================
-- Klotho Gene Therapy Example (from Step2ViewOutcomeLabels.tsx)
-- ==========================================================================
-- Assumes:
-- predictor_global_variable_id: 'klotho-therapy'
-- citation_id: 'cite-klotho-therapy-example'
-- outcome_global_variable_ids: 'adas-cog', 'memory-recall', 'executive-function', 'hippocampal-volume', 'immune-response', 'headache', 'fatigue'

-- Cognitive Improvements
INSERT INTO global_variable_relationships
  (predictor_global_variable_id, outcome_global_variable_id, citation_id, category, category_display_order, item_display_order, percentage_change, is_positive_outcome)
VALUES
  ('klotho-therapy', 'adas-cog', 'cite-klotho-therapy-example', 'Cognitive Improvements (Example)', 1, 1, 28, true),
  ('klotho-therapy', 'memory-recall', 'cite-klotho-therapy-example', 'Cognitive Improvements (Example)', 1, 2, 35, true),
  ('klotho-therapy', 'executive-function', 'cite-klotho-therapy-example', 'Cognitive Improvements (Example)', 1, 3, 22, true),
  ('klotho-therapy', 'hippocampal-volume', 'cite-klotho-therapy-example', 'Cognitive Improvements (Example)', 1, 4, 15, true);

-- Side Effects
INSERT INTO global_variable_relationships
  (predictor_global_variable_id, outcome_global_variable_id, citation_id, category, category_display_order, item_display_order, percentage_change, is_positive_outcome)
VALUES
  ('klotho-therapy', 'immune-response', 'cite-klotho-therapy-example', 'Side Effects (Example)', 2, 1, 12, false),
  ('klotho-therapy', 'headache', 'cite-klotho-therapy-example', 'Side Effects (Example)', 2, 2, 9, false),
  ('klotho-therapy', 'fatigue', 'cite-klotho-therapy-example', 'Side Effects (Example)', 2, 3, 7, false); 