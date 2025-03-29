-- Units seed file
-- Contains seed data for measurement units

-- Insert units
INSERT INTO units (id, name, abbreviation, unit_category_id, is_default)
VALUES
-- Weight units
('kilogram', 'Kilogram', 'kg', 'weight', true),
('gram', 'Gram', 'g', 'weight', false),
('pound', 'Pound', 'lb', 'weight', false),

-- Length units
('meter', 'Meter', 'm', 'length', true),
('centimeter', 'Centimeter', 'cm', 'length', false),
('inch', 'Inch', 'in', 'length', false),

-- Temperature units
('celsius', 'Celsius', '°C', 'temperature', true),
('fahrenheit', 'Fahrenheit', '°F', 'temperature', false),

-- Pressure units
('mmhg', 'Millimeters of Mercury', 'mmHg', 'pressure', true),
('kilopascal', 'Kilopascal', 'kPa', 'pressure', false),

-- Concentration units
('mg-dl', 'Milligrams per Deciliter', 'mg/dL', 'concentration', true),
('mmol-l', 'Millimoles per Liter', 'mmol/L', 'concentration', false),

-- Frequency units
('bpm', 'Beats per Minute', 'bpm', 'frequency', true),
('breaths-min', 'Breaths per Minute', 'breaths/min', 'frequency', false),

-- Percentage units
('percent', 'Percent', '%', 'percentage', true);
