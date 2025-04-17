-- Seed data for global_variable_relationships table

-- ==========================================================================
-- Atorvastatin 20mg Example (from OutcomeLabelsSection.tsx)
-- ==========================================================================
-- Assumes:
-- predictor_global_variable_id: 'atorvastatin-20mg'
-- citation_id: 'cite-atorvastatin-example'
-- unit_ids: 'milligrams-per-deciliter', 'percent'
-- outcome_global_variable_ids: 'ldl-cholesterol', 'total-cholesterol', 'cv-event-risk', 'hdl-cholesterol', 'triglycerides', 'muscle-pain', 'liver-enzyme-elevation', 'headache'

-- Map old categories to new ENUM
-- Primary Outcomes -> Efficacy
-- Secondary Benefits -> Mechanism (as they are biomarker changes secondary to main goal) or Efficacy if preferred?
-- Side Effects -> Safety

-- Primary Outcomes -> Efficacy
INSERT INTO global_variable_relationships (
  -- Core IDs
  predictor_global_variable_id, outcome_global_variable_id, citation_id, condition_id,
  -- Categorization
  category, -- Removed display orders
  -- Metrics
  baseline_description, percentage_change, absolute_change_value, absolute_change_unit_id, nnh, nnt, is_positive_outcome,
  -- Confidence
  confidence_interval_level, absolute_change_ci_lower, absolute_change_ci_upper, percentage_change_ci_lower, percentage_change_ci_upper, p_value, certainty_of_evidence,
  -- Notes & Meta
  finding_specific_notes, data_last_updated
)
VALUES
  ('atorvastatin-20mg', 'ldl-cholesterol', 'cite-atorvastatin-example', NULL, 'Efficacy', '(baseline: 160 mg/dL)', -43, -69, 'milligrams-per-deciliter', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('atorvastatin-20mg', 'total-cholesterol', 'cite-atorvastatin-example', NULL, 'Efficacy', '(baseline: 240 mg/dL)', -32, -77, 'milligrams-per-deciliter', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('atorvastatin-20mg', 'cv-event-risk', 'cite-atorvastatin-example', NULL, 'Efficacy', '(10-year risk)', -36, -4.2, 'percent', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Secondary Benefits -> Mechanism
INSERT INTO global_variable_relationships (
  -- Core IDs
  predictor_global_variable_id, outcome_global_variable_id, citation_id, condition_id,
  -- Categorization
  category, -- Removed display orders
  -- Metrics
  baseline_description, percentage_change, absolute_change_value, absolute_change_unit_id, nnh, nnt, is_positive_outcome,
  -- Confidence
  confidence_interval_level, absolute_change_ci_lower, absolute_change_ci_upper, percentage_change_ci_lower, percentage_change_ci_upper, p_value, certainty_of_evidence,
  -- Notes & Meta
  finding_specific_notes, data_last_updated
)
VALUES
  ('atorvastatin-20mg', 'hdl-cholesterol', 'cite-atorvastatin-example', NULL, 'Mechanism', NULL, 5, 2.3, 'milligrams-per-deciliter', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('atorvastatin-20mg', 'triglycerides', 'cite-atorvastatin-example', NULL, 'Mechanism', NULL, -22, -35, 'milligrams-per-deciliter', NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Side Effects -> Safety
INSERT INTO global_variable_relationships (
  -- Core IDs
  predictor_global_variable_id, outcome_global_variable_id, citation_id, condition_id,
  -- Categorization
  category, -- Removed display orders
  -- Metrics
  baseline_description, percentage_change, absolute_change_value, absolute_change_unit_id, nnh, nnt, is_positive_outcome,
  -- Confidence
  confidence_interval_level, absolute_change_ci_lower, absolute_change_ci_upper, percentage_change_ci_lower, percentage_change_ci_upper, p_value, certainty_of_evidence,
  -- Notes & Meta
  finding_specific_notes, data_last_updated
)
VALUES
  ('atorvastatin-20mg', 'muscle-pain', 'cite-atorvastatin-example', NULL, 'Safety', '(vs. placebo)', NULL, NULL, NULL, 12, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('atorvastatin-20mg', 'liver-enzyme-elevation', 'cite-atorvastatin-example', NULL, 'Safety', NULL, NULL, NULL, NULL, 83, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('atorvastatin-20mg', 'headache', 'cite-atorvastatin-example', NULL, 'Safety', NULL, NULL, NULL, NULL, 26, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);


-- ==========================================================================
-- Klotho Gene Therapy Example (from Step2ViewOutcomeLabels.tsx)
-- ==========================================================================
-- Assumes:
-- predictor_global_variable_id: 'klotho-therapy'
-- citation_id: 'cite-klotho-therapy-example'
-- outcome_global_variable_ids: 'adas-cog', 'memory-recall', 'executive-function', 'hippocampal-volume', 'immune-response', 'headache', 'fatigue'

-- Map old categories to new ENUM
-- Cognitive Improvements -> Efficacy
-- Side Effects -> Safety

-- Cognitive Improvements -> Efficacy
INSERT INTO global_variable_relationships (
  -- Core IDs
  predictor_global_variable_id, outcome_global_variable_id, citation_id, condition_id,
  -- Categorization
  category, -- Removed display orders
  -- Metrics
  baseline_description, percentage_change, absolute_change_value, absolute_change_unit_id, nnh, nnt, is_positive_outcome,
  -- Confidence
  confidence_interval_level, absolute_change_ci_lower, absolute_change_ci_upper, percentage_change_ci_lower, percentage_change_ci_upper, p_value, certainty_of_evidence,
  -- Notes & Meta
  finding_specific_notes, data_last_updated
)
VALUES
  ('klotho-therapy', 'adas-cog', 'cite-klotho-therapy-example', NULL, 'Efficacy', NULL, 28, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('klotho-therapy', 'memory-recall', 'cite-klotho-therapy-example', NULL, 'Efficacy', NULL, 35, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('klotho-therapy', 'executive-function', 'cite-klotho-therapy-example', NULL, 'Efficacy', NULL, 22, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('klotho-therapy', 'hippocampal-volume', 'cite-klotho-therapy-example', NULL, 'Efficacy', NULL, 15, NULL, NULL, NULL, NULL, true, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- Side Effects -> Safety
INSERT INTO global_variable_relationships (
  -- Core IDs
  predictor_global_variable_id, outcome_global_variable_id, citation_id, condition_id,
  -- Categorization
  category, -- Removed display orders
  -- Metrics
  baseline_description, percentage_change, absolute_change_value, absolute_change_unit_id, nnh, nnt, is_positive_outcome,
  -- Confidence
  confidence_interval_level, absolute_change_ci_lower, absolute_change_ci_upper, percentage_change_ci_lower, percentage_change_ci_upper, p_value, certainty_of_evidence,
  -- Notes & Meta
  finding_specific_notes, data_last_updated
)
VALUES
  ('klotho-therapy', 'immune-response', 'cite-klotho-therapy-example', NULL, 'Safety', NULL, 12, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('klotho-therapy', 'headache', 'cite-klotho-therapy-example', NULL, 'Safety', NULL, 9, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  ('klotho-therapy', 'fatigue', 'cite-klotho-therapy-example', NULL, 'Safety', NULL, 7, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL); 