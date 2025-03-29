-- Units seed file
-- Contains seed data for measurement units adhering to UCUM where applicable
-- and handling dimensionless units for counts/ratings.
-- Conversion factor/offset defined as converting FROM base unit TO this unit.

-- Clear existing units before inserting new ones to avoid conflicts
DELETE FROM units CASCADE;

-- Insert units
-- Columns: id, unit_category_id, name, abbreviated_name, ucum_code, conversion_factor, conversion_offset
INSERT INTO units (id, unit_category_id, name, abbreviated_name, ucum_code, conversion_factor, conversion_offset)
VALUES
-- Dimensionless (Base: 'dimensionless-unit')
('dimensionless-unit', 'dimensionless', 'Dimensionless', '1', '1', 1, 0), -- Base Unit (using '1' for UCUM)
('one-to-five-scale', 'dimensionless', 'One to Five Scale', '1-5', NULL, 1, 0), -- Factor assumes normalization happens elsewhere
('one-to-ten-scale', 'dimensionless', 'One to Ten Scale', '1-10', NULL, 1, 0), -- Factor assumes normalization happens elsewhere
('kilograms-per-square-meter', 'dimensionless', 'Kilograms per Square Meter', 'kg/m2', 'kg/m2', 1, 0), -- BMI - treated as dimensionless score

-- Weight / Mass (Base: 'kilogram')
('kilogram', 'weight', 'Kilogram', 'kg', 'kg', 1, 0), -- Base Unit, UCUM base unit for mass
('gram', 'weight', 'Gram', 'g', 'g', 1000, 0), -- 1 kg = 1000 g
('milligram', 'weight', 'Milligram', 'mg', 'mg', 1000000, 0), -- 1 kg = 1,000,000 mg
('microgram', 'weight', 'Microgram', 'ug', 'ug', 1000000000, 0), -- 1 kg = 1,000,000,000 ug
('pound', 'weight', 'Pound', 'lb', '[lb_av]', 2.20462, 0), -- UCUM uses [lb_av] for avoirdupois pound; 1 kg = 2.20462 lb

-- Length (Base: 'meter')
('meter', 'length', 'Meter', 'm', 'm', 1, 0), -- Base Unit, UCUM base unit
('kilometer', 'length', 'Kilometer', 'km', 'km', 0.001, 0), -- 1 m = 0.001 km
('centimeter', 'length', 'Centimeter', 'cm', 'cm', 100, 0), -- 1 m = 100 cm
('millimeter', 'length', 'Millimeter', 'mm', 'mm', 1000, 0), -- 1 m = 1000 mm
('inch', 'length', 'Inch', 'in', '[in_i]', 39.3701, 0), -- UCUM uses [in_i]; 1 m = 39.3701 in
('foot', 'length', 'Foot', 'ft', '[ft_i]', 3.28084, 0), -- UCUM uses [ft_i]; 1 m = 3.28084 ft
('mile', 'length', 'Mile', 'mi', '[mi_i]', 0.000621371, 0), -- UCUM uses [mi_i]; 1 m = 0.000621371 mi

-- Temperature (Base: 'celsius')
('celsius', 'temperature', 'Celsius', '°C', 'Cel', 1, 0), -- Base Unit, UCUM symbol
('fahrenheit', 'temperature', 'Fahrenheit', '°F', '[degF]', 1.8, 32), -- UCUM symbol; F = C * 1.8 + 32

-- Concentration (Base: 'millimoles-per-liter' - Common SI unit in medicine)
('millimoles-per-liter', 'concentration', 'Millimoles per Liter', 'mmol/L', 'mmol/L', 1, 0), -- Base Unit
('milligrams-per-deciliter', 'concentration', 'Milligrams per Deciliter', 'mg/dL', 'mg/dL', 18.0182, 0), -- Approx factor for Glucose (molar mass ~180.16 g/mol). Note: factor depends on substance! Use specific units if needed.
('grams-per-liter', 'concentration', 'Grams per Liter', 'g/L', 'g/L', 1, 0), -- Placeholder: factor depends on substance molar mass

-- Cell Count (Base: 'per-microliter')
('per-microliter', 'cell-count', 'Per Microliter', '/uL', '/uL', 1, 0), -- Base Unit

-- Volume (Base: 'liter')
('liter', 'volume', 'Liter', 'L', 'L', 1, 0), -- Base Unit
('milliliter', 'volume', 'Milliliter', 'mL', 'mL', 1000, 0), -- 1 L = 1000 mL
('deciliter', 'volume', 'Deciliter', 'dL', 'dL', 10, 0), -- 1 L = 10 dL

-- Energy (Base: 'kilojoule')
('kilojoule', 'energy', 'Kilojoule', 'kJ', 'kJ', 1, 0), -- Base Unit (SI)
('kilocalorie', 'energy', 'Kilocalorie', 'kcal', 'kcal', 0.239006, 0), -- 1 kJ = 0.239006 kcal

-- Frequency (Base: 'per-day')
('per-day', 'frequency', 'Per Day', '/d', '/d', 1, 0), -- Base Unit
('per-week', 'frequency', 'Per Week', '/wk', '/wk', 0.142857, 0), -- 1/d = (1/7)/wk
('per-month', 'frequency', 'Per Month', '/mo', '/mo', 0.0328767, 0), -- 1/d = (1/30.4)/mo (approx)

-- Rate (Base: 'per-second')
('per-second', 'rate', 'Per Second', '/s', '/s', 1, 0), -- Base Unit
('per-minute', 'rate', 'Per Minute', '/min', '/min', 60, 0), -- 1/s = 60/min

-- Pressure (Base: 'pascal')
('pascal', 'pressure', 'Pascal', 'Pa', 'Pa', 1, 0), -- Base Unit (SI)
('millimeters-of-mercury', 'pressure', 'Millimeters of Mercury', 'mmHg', 'mm[Hg]', 0.00750062, 0), -- 1 Pa = 0.00750062 mmHg
('atmosphere', 'pressure', 'Atmosphere', 'atm', 'atm', 0.00000986923, 0), -- 1 Pa = 9.86923e-6 atm

-- Time (Base: 'second')
('second', 'time', 'Second', 's', 's', 1, 0), -- Base Unit, UCUM base unit
('minute', 'time', 'Minute', 'min', 'min', 0.0166667, 0), -- 1 s = 1/60 min
('hour', 'time', 'Hour', 'h', 'h', 0.000277778, 0), -- 1 s = 1/3600 h
('day', 'time', 'Day', 'd', 'd', 0.0000115741, 0), -- 1 s = 1/86400 d
('week', 'time', 'Week', 'wk', 'wk', 0.00000165344, 0), -- 1 s = 1/604800 wk
('month', 'time', 'Month', 'mo', 'mo', 3.80517e-7, 0), -- 1 s = 1/(30.4*86400) mo (approx)
('year', 'time', 'Year', 'a', 'a', 3.17098e-8, 0), -- 1 s = 1/(365.25*86400) a (approx)

-- Noise (Base: 'decibel') - Note: dB is logarithmic, direct factor conversion is not standard. Stored as is.
('decibel', 'noise', 'Decibel', 'dB', 'dB', 1, 0), -- Base Unit

-- Air Quality (Base: 'micrograms-per-cubic-meter' - common for PM2.5 etc.)
('micrograms-per-cubic-meter', 'air-quality', 'Micrograms per Cubic Meter', 'µg/m³', 'ug/m3', 1, 0), -- Base Unit
('parts-per-million', 'air-quality', 'Parts Per Million', 'ppm', 'ppm', 1, 0), -- Placeholder: conversion depends on substance molar mass and conditions
('parts-per-billion', 'air-quality', 'Parts Per Billion', 'ppb', 'ppb', 1, 0), -- Placeholder: conversion depends on substance molar mass and conditions

-- Percentage (Base: 'percent')
('percent', 'percentage', 'Percent', '%', '%', 1, 0), -- Base Unit

-- Currency (Base: 'us-dollar') - Note: Exchange rates vary, factor is placeholder only.
('us-dollar', 'currency', 'US Dollar', 'USD', '[USD]', 1, 0), -- Base Unit
('euro', 'currency', 'Euro', 'EUR', '[EUR]', 1, 0), -- Placeholder
('british-pound', 'currency', 'British Pound', 'GBP', '[GBP]', 1, 0), -- Placeholder

-- Age (Base: 'year-age')
('year-age', 'age', 'Years (age)', 'yr', 'a', 1, 0); -- Base Unit, UCUM unit for year

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
