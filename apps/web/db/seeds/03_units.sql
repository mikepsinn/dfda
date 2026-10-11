-- Units seed file
-- Contains seed data for measurement units adhering to UCUM where applicable
-- and handling dimensionless units for counts/ratings.
-- Conversion factor/offset defined as converting FROM base unit TO this unit.

-- Clear existing units before inserting new ones to avoid conflicts
DELETE FROM units CASCADE;

-- Insert units
-- Columns: id, unit_category_id, name, abbreviated_name, ucum_code, conversion_factor, conversion_offset, emoji
INSERT INTO units (id, unit_category_id, name, abbreviated_name, ucum_code, conversion_factor, conversion_offset, emoji)
VALUES
-- Dimensionless (Base: 'dimensionless-unit')
('dimensionless-unit', 'dimensionless', 'Dimensionless', '1', '1', 1, 0, '🔢'), -- Base Unit
('one-to-five-scale', 'dimensionless', 'One to Five Scale', '1-5', NULL, 1, 0, '⑤'),
('one-to-ten-scale', 'dimensionless', 'One to Ten Scale', '1-10', NULL, 1, 0, '🔟'),
('zero-to-ten-scale', 'dimensionless', 'Zero to Ten Scale', '0-10', NULL, 1, 0, '🔟'), -- Using the same emoji for now
('kilograms-per-square-meter', 'dimensionless', 'Kilograms per Square Meter', 'kg/m2', 'kg/m2', 1, 0, '📊'), -- BMI
('boolean', 'dimensionless', 'Boolean (1=Yes/True, 0=No/False)', 'bool', NULL, 1, 0, '✅'),

-- Weight / Mass (Base: 'kilogram')
('kilogram', 'weight', 'Kilogram', 'kg', 'kg', 1, 0, '⚖️'), -- Base Unit
('gram', 'weight', 'Gram', 'g', 'g', 1000, 0, '⚖️'),
('milligram', 'weight', 'Milligram', 'mg', 'mg', 1000000, 0, '⚖️'),
('microgram', 'weight', 'Microgram', 'ug', 'ug', 1000000000, 0, '⚖️'),
('pound', 'weight', 'Pound', 'lb', '[lb_av]', 2.20462, 0, '⚖️'),

-- Length (Base: 'meter')
('meter', 'length', 'Meter', 'm', 'm', 1, 0, '📏'), -- Base Unit
('kilometer', 'length', 'Kilometer', 'km', 'km', 0.001, 0, '📏'),
('centimeter', 'length', 'Centimeter', 'cm', 'cm', 100, 0, '📏'),
('millimeter', 'length', 'Millimeter', 'mm', 'mm', 1000, 0, '📏'),
('inch', 'length', 'Inch', 'in', '[in_i]', 39.3701, 0, '📏'),
('foot', 'length', 'Foot', 'ft', '[ft_i]', 3.28084, 0, '📏'),
('mile', 'length', 'Mile', 'mi', '[mi_i]', 0.000621371, 0, '📏'),

-- Temperature (Base: 'celsius')
('celsius', 'temperature', 'Celsius', '°C', 'Cel', 1, 0, '🌡️'), -- Base Unit
('fahrenheit', 'temperature', 'Fahrenheit', '°F', '[degF]', 1.8, 32, '🌡️'),

-- Concentration (Base: 'millimoles-per-liter')
('millimoles-per-liter', 'concentration', 'Millimoles per Liter', 'mmol/L', 'mmol/L', 1, 0, '🧪'), -- Base Unit
('milligrams-per-deciliter', 'concentration', 'Milligrams per Deciliter', 'mg/dL', 'mg/dL', 18.0182, 0, '🧪'),
('grams-per-liter', 'concentration', 'Grams per Liter', 'g/L', 'g/L', 1, 0, '🧪'),

-- Cell Count (Base: 'per-microliter')
('per-microliter', 'cell-count', 'Per Microliter', '/uL', '/uL', 1, 0, '🔬'), -- Base Unit

-- Volume (Base: 'liter')
('liter', 'volume', 'Liter', 'L', 'L', 1, 0, '💧'), -- Base Unit
('milliliter', 'volume', 'Milliliter', 'mL', 'mL', 1000, 0, '💧'),
('deciliter', 'volume', 'Deciliter', 'dL', 'dL', 10, 0, '💧'),

-- Energy (Base: 'kilojoule')
('kilojoule', 'energy', 'Kilojoule', 'kJ', 'kJ', 1, 0, '⚡'), -- Base Unit
('kilocalorie', 'energy', 'Kilocalorie', 'kcal', 'kcal', 0.239006, 0, '⚡'),

-- Frequency (Base: 'per-day')
('per-day', 'frequency', 'Per Day', '/d', '/d', 1, 0, '🔄'), -- Base Unit
('per-week', 'frequency', 'Per Week', '/wk', '/wk', 0.142857, 0, '🔄'),
('per-month', 'frequency', 'Per Month', '/mo', '/mo', 0.0328767, 0, '🔄'),

-- Rate (Base: 'per-second')
('per-second', 'rate', 'Per Second', '/s', '/s', 1, 0, '💓'), -- Base Unit
('per-minute', 'rate', 'Per Minute', '/min', '/min', 60, 0, '💓'),

-- Pressure (Base: 'pascal')
('pascal', 'pressure', 'Pascal', 'Pa', 'Pa', 1, 0, '💨'), -- Base Unit
('millimeters-of-mercury', 'pressure', 'Millimeters of Mercury', 'mmHg', 'mm[Hg]', 0.00750062, 0, '💨'),
('atmosphere', 'pressure', 'Atmosphere', 'atm', 'atm', 0.00000986923, 0, '💨'),

-- Time (Base: 'second')
('second', 'time', 'Second', 's', 's', 1, 0, '⏱️'), -- Base Unit
('minute', 'time', 'Minute', 'min', 'min', 0.0166667, 0, '⏱️'),
('hour', 'time', 'Hour', 'h', 'h', 0.000277778, 0, '⏱️'),
('day', 'time', 'Day', 'd', 'd', 0.0000115741, 0, '⏱️'),
('week', 'time', 'Week', 'wk', 'wk', 0.00000165344, 0, '⏱️'),
('month', 'time', 'Month', 'mo', 'mo', 3.80517e-7, 0, '⏱️'),
('year', 'time', 'Year', 'a', 'a', 3.17098e-8, 0, '⏱️'),

-- Noise (Base: 'decibel')
('decibel', 'noise', 'Decibel', 'dB', 'dB', 1, 0, '🔊'), -- Base Unit

-- Air Quality (Base: 'micrograms-per-cubic-meter')
('micrograms-per-cubic-meter', 'air-quality', 'Micrograms per Cubic Meter', 'µg/m³', 'ug/m3', 1, 0, '🌬️'), -- Base Unit
('parts-per-million', 'air-quality', 'Parts Per Million', 'ppm', 'ppm', 1, 0, '🌬️'),
('parts-per-billion', 'air-quality', 'Parts Per Billion', 'ppb', 'ppb', 1, 0, '🌬️'),

-- Percentage (Base: 'percent')
('percent', 'percentage', 'Percent', '%', '%', 1, 0, '%'), -- Base Unit

-- Currency (Base: 'us-dollar')
('us-dollar', 'currency', 'US Dollar', 'USD', '[USD]', 1, 0, '💰'), -- Base Unit
('euro', 'currency', 'Euro', 'EUR', '[EUR]', 1, 0, '💰'),
('british-pound', 'currency', 'British Pound', 'GBP', '[GBP]', 1, 0, '💰'),

-- Age (Base: 'year-age')
('year-age', 'age', 'Years (age)', 'yr', 'a', 1, 0, '🎂');

-- Update unit_categories with their base unit IDs
-- This must run AFTER units are inserted
UPDATE unit_categories SET base_unit_id = 'dimensionless-unit' WHERE id = 'dimensionless';
UPDATE unit_categories SET base_unit_id = 'kilogram' WHERE id = 'weight';
UPDATE unit_categories SET base_unit_id = 'meter' WHERE id = 'length';
UPDATE unit_categories SET base_unit_id = 'celsius' WHERE id = 'temperature';
UPDATE unit_categories SET base_unit_id = 'millimoles-per-liter' WHERE id = 'concentration';
UPDATE unit_categories SET base_unit_id = 'per-microliter' WHERE id = 'cell-count';
UPDATE unit_categories SET base_unit_id = 'liter' WHERE id = 'volume';
UPDATE unit_categories SET base_unit_id = 'kilojoule' WHERE id = 'energy';
UPDATE unit_categories SET base_unit_id = 'per-day' WHERE id = 'frequency';
UPDATE unit_categories SET base_unit_id = 'per-second' WHERE id = 'rate';
UPDATE unit_categories SET base_unit_id = 'pascal' WHERE id = 'pressure';
UPDATE unit_categories SET base_unit_id = 'second' WHERE id = 'time';
UPDATE unit_categories SET base_unit_id = 'decibel' WHERE id = 'noise';
UPDATE unit_categories SET base_unit_id = 'micrograms-per-cubic-meter' WHERE id = 'air-quality';
UPDATE unit_categories SET base_unit_id = 'percent' WHERE id = 'percentage';
UPDATE unit_categories SET base_unit_id = 'us-dollar' WHERE id = 'currency';
UPDATE unit_categories SET base_unit_id = 'year-age' WHERE id = 'age';

-- Blood marker units (also in migration 20261011020000 for existing databases)
INSERT INTO units (id, unit_category_id, name, abbreviated_name, ucum_code, conversion_factor, conversion_offset, emoji)
VALUES
('units-per-liter', 'enzyme-activity', 'Units per Liter', 'U/L', 'U/L', 1, 0, '🧪'), -- Base Unit
('nanograms-per-milliliter', 'mass-concentration', 'Nanograms per Milliliter', 'ng/mL', 'ng/mL', 1, 0, '🧪'), -- Base Unit
('milligrams-per-liter', 'mass-concentration', 'Milligrams per Liter', 'mg/L', 'mg/L', 0.001, 0, '🧪');
UPDATE unit_categories SET base_unit_id = 'units-per-liter' WHERE id = 'enzyme-activity';
UPDATE unit_categories SET base_unit_id = 'nanograms-per-milliliter' WHERE id = 'mass-concentration';
