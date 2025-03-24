-- Data Quality Rules
--
-- Rules for validating and ensuring data quality
-- Applied to measurements and other user-submitted data
--
CREATE TABLE reference.data_quality_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL,
    validation_function TEXT,
    error_message TEXT,
    severity VARCHAR(20) DEFAULT 'ERROR',
    applies_to_table VARCHAR(100),
    applies_to_column VARCHAR(100),
    parameters JSONB,
    is_active BOOLEAN DEFAULT true,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default rules
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