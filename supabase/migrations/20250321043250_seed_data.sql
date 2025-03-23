-- =============================================
-- SEED DATA - Initial Data Population
-- =============================================

-- Core Schema - User Groups
INSERT INTO core.user_groups (name, description) VALUES
('administrators', 'System administrators with full access'),
('staff', 'Staff members with elevated privileges'),
('researchers', 'Research team members'),
('providers', 'Healthcare providers'),
('patients', 'Regular patients/users');

-- Core Schema - User Permissions
INSERT INTO core.user_permissions (permission, description) VALUES
('manage_users', 'Can manage user accounts'),
('view_users', 'Can view user profiles'),
('manage_trials', 'Can manage clinical trials'),
('view_trials', 'Can view clinical trial data'),
('manage_medical', 'Can manage medical records'),
('view_medical', 'Can view medical records'),
('manage_commerce', 'Can manage e-commerce operations'),
('view_commerce', 'Can view e-commerce data'),
('manage_scheduling', 'Can manage scheduling'),
('view_scheduling', 'Can view schedules'),
('manage_logistics', 'Can manage logistics'),
('view_logistics', 'Can view logistics data'),
('manage_finances', 'Can manage financial operations'),
('view_finances', 'Can view financial data'),
('manage_oauth2', 'Can manage OAuth2 applications'),
('view_oauth2', 'Can view OAuth2 data');

-- Medical Reference Schema - Variable Categories
INSERT INTO medical_ref.variable_categories (name, description, display_name) VALUES
('vital_signs', 'Basic health measurements', 'Vital Signs'),
('lab_results', 'Laboratory test results', 'Lab Results'),
('medications', 'Medication tracking', 'Medications'),
('symptoms', 'Symptom tracking', 'Symptoms'),
('conditions', 'Medical conditions', 'Conditions'),
('lifestyle', 'Lifestyle factors', 'Lifestyle'),
('nutrition', 'Nutrition tracking', 'Nutrition'),
('physical_activity', 'Physical activity tracking', 'Physical Activity');

-- Medical Reference Schema - Units of Measurement
ALTER TABLE medical_ref.units_of_measurement 
ADD COLUMN slug varchar GENERATED ALWAYS AS (
    lower(regexp_replace(name, '[^a-zA-Z0-9]+', '-', 'g'))
) STORED,
ADD COLUMN minimum_value double precision,
ADD COLUMN maximum_value double precision,
ADD COLUMN deleted_at timestamp,
ADD COLUMN sort_order integer DEFAULT 0,
ADD COLUMN conversion_steps text;

-- Update conversion steps for temperature units
UPDATE medical_ref.units_of_measurement 
SET conversion_steps = 'to_si: value + 273.15; from_si: value - 273.15'
WHERE ucum_code = 'Cel';

UPDATE medical_ref.units_of_measurement 
SET conversion_steps = 'to_si: (value - 32) * 5/9 + 273.15; from_si: (value - 273.15) * 9/5 + 32'
WHERE ucum_code = '[degF]';

-- Set reasonable min/max values for common measurements
UPDATE medical_ref.units_of_measurement 
SET minimum_value = 0, maximum_value = 1000
WHERE unit_type = 'mass';

UPDATE medical_ref.units_of_measurement 
SET minimum_value = 0, maximum_value = 500
WHERE unit_type = 'volume';

UPDATE medical_ref.units_of_measurement 
SET minimum_value = -20, maximum_value = 50
WHERE ucum_code = 'Cel';

UPDATE medical_ref.units_of_measurement 
SET minimum_value = -4, maximum_value = 122
WHERE ucum_code = '[degF]';

UPDATE medical_ref.units_of_measurement 
SET minimum_value = 0, maximum_value = 300
WHERE ucum_code = 'mm[Hg]';

-- Set sort order for common units
UPDATE medical_ref.units_of_measurement 
SET sort_order = CASE 
    WHEN ucum_code = 'mg' THEN 1
    WHEN ucum_code = 'g' THEN 2
    WHEN ucum_code = 'kg' THEN 3
    WHEN ucum_code = '[lb_av]' THEN 4
    WHEN ucum_code = 'mL' THEN 1
    WHEN ucum_code = 'L' THEN 2
    WHEN ucum_code = 'Cel' THEN 1
    WHEN ucum_code = '[degF]' THEN 2
    ELSE 99
END;

-- Mass/Weight units
INSERT INTO medical_ref.units_of_measurement (
    name, 
    symbol, 
    ucum_code,
    description, 
    unit_type,
    conversion_multiplier,
    is_si_unit,
    display_precision
) VALUES
('milligram', 'mg', 'mg', 'Weight in milligrams', 'mass', 0.001, false, 2),
('gram', 'g', 'g', 'Weight in grams', 'mass', 1.0, true, 2),
('kilogram', 'kg', 'kg', 'Weight in kilograms', 'mass', 1000.0, false, 1),
('pound', 'lb', '[lb_av]', 'Weight in pounds', 'mass', 453.59237, false, 1),
('ounce', 'oz', '[oz_av]', 'Weight in ounces', 'mass', 28.349523125, false, 1),

-- Volume units
('milliliter', 'mL', 'mL', 'Volume in milliliters', 'volume', 0.001, false, 2),
('liter', 'L', 'L', 'Volume in liters', 'volume', 1.0, true, 2),
('cubic centimeter', 'cc', 'cm3', 'Volume in cubic centimeters', 'volume', 0.001, false, 2),
('fluid ounce', 'fl oz', '[foz_us]', 'Volume in fluid ounces (US)', 'volume', 0.0295735295625, false, 2),

-- Length units
('millimeter', 'mm', 'mm', 'Length in millimeters', 'length', 0.001, false, 1),
('centimeter', 'cm', 'cm', 'Length in centimeters', 'length', 0.01, false, 1),
('meter', 'm', 'm', 'Length in meters', 'length', 1.0, true, 2),
('inch', 'in', '[in_i]', 'Length in inches', 'length', 0.0254, false, 1),
('foot', 'ft', '[ft_i]', 'Length in feet', 'length', 0.3048, false, 1),

-- Temperature units (special conversion handled in code)
('celsius', '°C', 'Cel', 'Temperature in Celsius', 'temperature', 1.0, true, 1),
('fahrenheit', '°F', '[degF]', 'Temperature in Fahrenheit', 'temperature', NULL, false, 1),
('kelvin', 'K', 'K', 'Temperature in Kelvin', 'temperature', NULL, false, 1),

-- Pressure units
('millimeter of mercury', 'mmHg', 'mm[Hg]', 'Pressure in millimeters of mercury', 'pressure', 133.322, false, 1),
('kilopascal', 'kPa', 'kPa', 'Pressure in kilopascals', 'pressure', 1000.0, false, 2),
('pascal', 'Pa', 'Pa', 'Pressure in pascals', 'pressure', 1.0, true, 0),

-- Time units
('second', 'sec', 's', 'Time in seconds', 'time', 1.0, true, 0),
('minute', 'min', 'min', 'Time in minutes', 'time', 60.0, false, 0),
('hour', 'hr', 'h', 'Time in hours', 'time', 3600.0, false, 1),
('day', 'd', 'd', 'Time in days', 'time', 86400.0, false, 1),
('week', 'wk', 'wk', 'Time in weeks', 'time', 604800.0, false, 1),

-- Rate units
('per second', '/s', '/s', 'Rate per second', 'rate', 1.0, true, 2),
('per minute', '/min', '/min', 'Rate per minute', 'rate', 0.0166666667, false, 2),
('per hour', '/hr', '/h', 'Rate per hour', 'rate', 0.000277778, false, 3),
('beats per minute', 'bpm', '{beats}/min', 'Heart rate', 'rate', 0.0166666667, false, 0),
('breaths per minute', 'br/min', '{breaths}/min', 'Respiratory rate', 'rate', 0.0166666667, false, 0),

-- Concentration units
('milligrams per deciliter', 'mg/dL', 'mg/dL', 'Concentration in mg/dL', 'concentration', 0.01, false, 1),
('millimoles per liter', 'mmol/L', 'mmol/L', 'Concentration in mmol/L', 'concentration', 1.0, true, 2),
('micrograms per milliliter', 'µg/mL', 'ug/mL', 'Concentration in µg/mL', 'concentration', 0.001, false, 2),

-- Ratio units
('percentage', '%', '%', 'Ratio as percentage', 'ratio', 0.01, false, 1),
('ratio', 'ratio', '1', 'Pure ratio', 'ratio', 1.0, true, 3),

-- Count units (no conversion needed)
('count', '', '1', 'Simple count', 'count', 1.0, true, 0),
('steps', 'steps', '{steps}', 'Number of steps', 'count', 1.0, false, 0),

-- Energy units
('calorie', 'cal', 'cal', 'Energy in calories', 'energy', 4.184, false, 1),
('kilocalorie', 'kcal', 'kcal', 'Energy in kilocalories', 'energy', 4184.0, false, 1),
('joule', 'J', 'J', 'Energy in joules', 'energy', 1.0, true, 1),
('kilojoule', 'kJ', 'kJ', 'Energy in kilojoules', 'energy', 1000.0, false, 1);

-- Medical Reference Schema - Common Lab Tests
INSERT INTO medical_ref.lab_tests (name, description, category, unit_id) VALUES
('blood_glucose', 'Blood glucose level', 'blood', (SELECT id FROM medical_ref.units_of_measurement WHERE ucum_code = 'mg/dL')),
('hemoglobin_a1c', 'Hemoglobin A1C percentage', 'blood', (SELECT id FROM medical_ref.units_of_measurement WHERE ucum_code = '%')),
('total_cholesterol', 'Total cholesterol level', 'blood', (SELECT id FROM medical_ref.units_of_measurement WHERE ucum_code = 'mg/dL')),
('hdl_cholesterol', 'HDL cholesterol level', 'blood', (SELECT id FROM medical_ref.units_of_measurement WHERE ucum_code = 'mg/dL')),
('ldl_cholesterol', 'LDL cholesterol level', 'blood', (SELECT id FROM medical_ref.units_of_measurement WHERE ucum_code = 'mg/dL')),
('triglycerides', 'Triglycerides level', 'blood', (SELECT id FROM medical_ref.units_of_measurement WHERE ucum_code = 'mg/dL')),
('blood_pressure_systolic', 'Systolic blood pressure', 'vital', (SELECT id FROM medical_ref.units_of_measurement WHERE ucum_code = 'mm[Hg]')),
('blood_pressure_diastolic', 'Diastolic blood pressure', 'vital', (SELECT id FROM medical_ref.units_of_measurement WHERE ucum_code = 'mm[Hg]')),
('heart_rate', 'Heart rate', 'vital', (SELECT id FROM medical_ref.units_of_measurement WHERE ucum_code = '{beats}/min')),
('body_temperature', 'Body temperature', 'vital', (SELECT id FROM medical_ref.units_of_measurement WHERE ucum_code = 'Cel'));

-- Commerce Schema - Service Types
INSERT INTO scheduling.service_types (name, description, duration_minutes, is_active) VALUES
('initial_consultation', 'Initial medical consultation', 60, true),
('follow_up', 'Follow-up appointment', 30, true),
('lab_review', 'Laboratory results review', 30, true),
('treatment_session', 'Treatment session', 45, true),
('emergency_consultation', 'Emergency consultation', 60, true);

-- Logistics Schema - Shipping Methods
INSERT INTO logistics.shipping_methods (name, description, estimated_days_min, estimated_days_max, is_active) VALUES
('standard', 'Standard shipping (5-7 business days)', 5, 7, true),
('express', 'Express shipping (2-3 business days)', 2, 3, true),
('overnight', 'Overnight shipping (next business day)', 1, 1, true),
('international', 'International shipping (7-14 business days)', 7, 14, true);

-- Create default shipping rates
INSERT INTO logistics.shipping_rates (shipping_method_id, zone, base_rate, rate_per_kg) VALUES
((SELECT id FROM logistics.shipping_methods WHERE name = 'standard'), 'domestic', 5.99, 0.50),
((SELECT id FROM logistics.shipping_methods WHERE name = 'express'), 'domestic', 12.99, 1.00),
((SELECT id FROM logistics.shipping_methods WHERE name = 'overnight'), 'domestic', 24.99, 2.00),
((SELECT id FROM logistics.shipping_methods WHERE name = 'international'), 'international', 19.99, 3.00); 