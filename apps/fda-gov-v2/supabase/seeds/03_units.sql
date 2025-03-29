-- Units seed file
-- Contains seed data for measurement units adhering to UCUM where applicable
-- and handling dimensionless units for counts/ratings.
-- Conversion factor/offset defined as converting FROM base unit TO this unit.

-- Clear existing units before inserting new ones to avoid conflicts
DELETE FROM units;

-- Insert units
-- Columns: id, name, abbreviation, category_id, conversion_factor, conversion_offset, is_si
INSERT INTO units (id, name, abbreviation, category_id, conversion_factor, conversion_offset, is_si)
VALUES
-- Dimensionless (Base: '1')
('1', 'Dimensionless', '1', 'dimensionless', 1, 0, false), -- Base Unit
('one-to-five', 'One to Five Scale', '1-5', 'dimensionless', 1, 0, false), -- Factor assumes normalization happens elsewhere
('one-to-ten', 'One to Ten Scale', '1-10', 'dimensionless', 1, 0, false), -- Factor assumes normalization happens elsewhere
('kg/m2', 'Kilograms per Square Meter', 'kg/m2', 'dimensionless', 1, 0, false), -- BMI - treated as dimensionless score

-- Weight / Mass (Base: 'kg')
('kg', 'Kilogram', 'kg', 'weight', 1, 0, true), -- Base Unit, UCUM base unit for mass
('g', 'Gram', 'g', 'weight', 1000, 0, false), -- 1 kg = 1000 g
('mg', 'Milligram', 'mg', 'weight', 1000000, 0, false), -- 1 kg = 1,000,000 mg
('ug', 'Microgram', 'ug', 'weight', 1000000000, 0, false), -- 1 kg = 1,000,000,000 ug
('[lb_av]', 'Pound', '[lb_av]', 'weight', 2.20462, 0, false), -- UCUM uses [lb_av] for avoirdupois pound; 1 kg = 2.20462 lb

-- Length (Base: 'm')
('m', 'Meter', 'm', 'length', 1, 0, true), -- Base Unit, UCUM base unit
('km', 'Kilometer', 'km', 'length', 0.001, 0, false), -- 1 m = 0.001 km
('cm', 'Centimeter', 'cm', 'length', 100, 0, false), -- 1 m = 100 cm
('mm', 'Millimeter', 'mm', 'length', 1000, 0, false), -- 1 m = 1000 mm
('[in_i]', 'Inch', '[in_i]', 'length', 39.3701, 0, false), -- UCUM uses [in_i]; 1 m = 39.3701 in
('[ft_i]', 'Foot', '[ft_i]', 'length', 3.28084, 0, false), -- UCUM uses [ft_i]; 1 m = 3.28084 ft
('[mi_i]', 'Mile', '[mi_i]', 'length', 0.000621371, 0, false), -- UCUM uses [mi_i]; 1 m = 0.000621371 mi

-- Temperature (Base: 'Cel')
('Cel', 'Celsius', 'Cel', 'temperature', 1, 0, true), -- Base Unit, UCUM symbol
('[degF]', 'Fahrenheit', '[degF]', 'temperature', 1.8, 32, false), -- UCUM symbol; F = C * 1.8 + 32

-- Concentration (Base: 'mmol/L' - Common SI unit in medicine)
('mmol/L', 'Millimoles per Liter', 'mmol/L', 'concentration', 1, 0, true), -- Base Unit
('mg/dL', 'Milligrams per Deciliter', 'mg/dL', 'concentration', 18.0182, 0, false), -- Approx factor for Glucose (molar mass ~180.16 g/mol). Note: factor depends on substance! Use specific units if needed.
('g/L', 'Grams per Liter', 'g/L', 'concentration', 1, 0, false), -- Placeholder: factor depends on substance molar mass

-- Cell Count (Base: '/uL')
('/uL', 'Per Microliter', '/uL', 'cell-count', 1, 0, true), -- Base Unit

-- Volume (Base: 'L')
('L', 'Liter', 'L', 'volume', 1, 0, true), -- Base Unit
('mL', 'Milliliter', 'mL', 'volume', 1000, 0, false), -- 1 L = 1000 mL
('dL', 'Deciliter', 'dL', 'volume', 10, 0, false), -- 1 L = 10 dL

-- Energy (Base: 'kJ')
('kJ', 'Kilojoule', 'kJ', 'energy', 1, 0, true), -- Base Unit (SI)
('kcal', 'Kilocalorie', 'kcal', 'energy', 0.239006, 0, false), -- 1 kJ = 0.239006 kcal

-- Frequency (Base: '/d')
('/d', 'Per Day', '/d', 'frequency', 1, 0, true), -- Base Unit
('/wk', 'Per Week', '/wk', 'frequency', 0.142857, 0, false), -- 1/d = (1/7)/wk
('/mo', 'Per Month', '/mo', 'frequency', 0.0328767, 0, false), -- 1/d = (1/30.4)/mo (approx)

-- Rate (Base: '/s')
('/s', 'Per Second', '/s', 'rate', 1, 0, true), -- Base Unit
('/min', 'Per Minute', '/min', 'rate', 60, 0, false), -- 1/s = 60/min

-- Pressure (Base: 'Pa')
('Pa', 'Pascal', 'Pa', 'pressure', 1, 0, true), -- Base Unit (SI)
('mm[Hg]', 'Millimeters of Mercury', 'mm[Hg]', 'pressure', 0.00750062, 0, false), -- 1 Pa = 0.00750062 mmHg
('atm', 'Atmosphere', 'atm', 'pressure', 0.00000986923, 0, false), -- 1 Pa = 9.86923e-6 atm

-- Time (Base: 's')
('s', 'Second', 's', 'time', 1, 0, true), -- Base Unit, UCUM base unit
('min', 'Minute', 'min', 'time', 0.0166667, 0, false), -- 1 s = 1/60 min
('h', 'Hour', 'h', 'time', 0.000277778, 0, false), -- 1 s = 1/3600 h
('d', 'Day', 'd', 'time', 0.0000115741, 0, false), -- 1 s = 1/86400 d
('wk', 'Week', 'wk', 'time', 0.00000165344, 0, false), -- 1 s = 1/604800 wk
('mo', 'Month', 'mo', 'time', 3.80517e-7, 0, false), -- 1 s = 1/(30.4*86400) mo (approx)
('a', 'Year', 'a', 'time', 3.17098e-8, 0, false), -- 1 s = 1/(365.25*86400) a (approx)

-- Noise (Base: 'dB') - Note: dB is logarithmic, direct factor conversion is not standard. Stored as is.
('dB', 'Decibel', 'dB', 'noise', 1, 0, true), -- Base Unit

-- Air Quality (Base: 'ug/m3' - common for PM2.5 etc.)
('ug/m3', 'Micrograms per Cubic Meter', 'ug/m3', 'air-quality', 1, 0, true), -- Base Unit
('ppm', 'Parts Per Million', 'ppm', 'air-quality', 1, 0, false), -- Placeholder: conversion depends on substance molar mass and conditions
('ppb', 'Parts Per Billion', 'ppb', 'air-quality', 1, 0, false), -- Placeholder: conversion depends on substance molar mass and conditions

-- Percentage (Base: '%')
('%', 'Percent', '%', 'percentage', 1, 0, true), -- Base Unit

-- Currency (Base: 'USD') - Note: Exchange rates vary, factor is placeholder only.
('[USD]', 'US Dollar', 'USD', 'currency', 1, 0, true), -- Base Unit
('[EUR]', 'Euro', 'EUR', 'currency', 1, 0, false), -- Placeholder
('[GBP]', 'British Pound', 'GBP', 'currency', 1, 0, false), -- Placeholder

-- Age (Base: 'a' - year)
('a', 'Years (age)', 'a', 'age', 1, 0, true); -- Base Unit, UCUM unit for year

-- Update unit_categories with their base unit IDs
-- This must run AFTER units are inserted
UPDATE unit_categories SET base_unit_id = '1' WHERE id = 'dimensionless';
UPDATE unit_categories SET base_unit_id = 'kg' WHERE id = 'weight';
UPDATE unit_categories SET base_unit_id = 'm' WHERE id = 'length';
UPDATE unit_categories SET base_unit_id = 'Cel' WHERE id = 'temperature';
UPDATE unit_categories SET base_unit_id = 'mmol/L' WHERE id = 'concentration';
UPDATE unit_categories SET base_unit_id = '/uL' WHERE id = 'cell-count';
UPDATE unit_categories SET base_unit_id = 'L' WHERE id = 'volume';
UPDATE unit_categories SET base_unit_id = 'kJ' WHERE id = 'energy';
UPDATE unit_categories SET base_unit_id = '/d' WHERE id = 'frequency';
UPDATE unit_categories SET base_unit_id = '/s' WHERE id = 'rate';
UPDATE unit_categories SET base_unit_id = 'Pa' WHERE id = 'pressure';
UPDATE unit_categories SET base_unit_id = 's' WHERE id = 'time';
UPDATE unit_categories SET base_unit_id = 'dB' WHERE id = 'noise';
UPDATE unit_categories SET base_unit_id = 'ug/m3' WHERE id = 'air-quality';
UPDATE unit_categories SET base_unit_id = '%' WHERE id = 'percentage';
UPDATE unit_categories SET base_unit_id = '[USD]' WHERE id = 'currency';
UPDATE unit_categories SET base_unit_id = 'a' WHERE id = 'age';
