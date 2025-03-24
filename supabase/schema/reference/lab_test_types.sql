-- Lab Test Types
--
-- Standard laboratory test definitions and reference ranges
-- Used to validate and interpret lab results
--
CREATE TABLE reference.lab_test_types (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    name text NOT NULL UNIQUE,
    display_name text NOT NULL,
    description text,
    variable_id bigint REFERENCES reference.variables(id),
    loinc_code text UNIQUE,
    deleted_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed common lab test types
INSERT INTO reference.lab_test_types (name, display_name, description) VALUES
('blood_glucose', 'Blood Glucose', 'Blood glucose level measurement'),
('hemoglobin_a1c', 'Hemoglobin A1C', 'Hemoglobin A1C percentage measurement'),
('total_cholesterol', 'Total Cholesterol', 'Total cholesterol level measurement'),
('hdl_cholesterol', 'HDL Cholesterol', 'HDL cholesterol level measurement'),
('ldl_cholesterol', 'LDL Cholesterol', 'LDL cholesterol level measurement'),
('triglycerides', 'Triglycerides', 'Triglycerides level measurement'),
('blood_pressure_systolic', 'Systolic Blood Pressure', 'Systolic blood pressure measurement'),
('blood_pressure_diastolic', 'Diastolic Blood Pressure', 'Diastolic blood pressure measurement'),
('heart_rate', 'Heart Rate', 'Heart rate measurement'),
('body_temperature', 'Body Temperature', 'Body temperature measurement'); 