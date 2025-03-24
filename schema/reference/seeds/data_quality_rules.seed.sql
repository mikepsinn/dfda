-- Seed: reference.data_quality_rules
-- Seed data for reference.data_quality_rules

INSERT INTO reference.data_quality_rules 
(name, description, rule_type, validation_function, error_message, severity, applies_to_table, applies_to_column) 
VALUES 
('FUTURE_DATE_CHECK', 
 'Ensures dates are not in the future', 
 'DATE_VALIDATION',
 'date <= CURRENT_DATE',
 'Date cannot be in the future',
 'ERROR',
 NULL,
 NULL),

('NEGATIVE_VALUE_CHECK',
 'Ensures numeric values are not negative when inappropriate',
 'NUMERIC_VALIDATION',
 'value >= 0',
 'Value cannot be negative',
 'ERROR',
 NULL,
 NULL),

('OUTLIER_CHECK',
 'Flags statistical outliers for review',
 'STATISTICAL_VALIDATION',
 'ABS((value - avg) / stddev) <= 3',
 'Value is a statistical outlier',
 'WARNING',
 NULL,
 NULL),

('MISSING_REQUIRED_CHECK',
 'Ensures required fields are not null',
 'NULL_VALIDATION',
 'value IS NOT NULL',
 'Required field cannot be null',
 'ERROR',
 NULL,
 NULL),

('DUPLICATE_CHECK',
 'Identifies potential duplicate entries',
 'DUPLICATE_VALIDATION',
 'COUNT(*) = 1',
 'Potential duplicate entry detected',
 'WARNING',
 NULL,
 NULL);
