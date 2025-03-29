-- Units seed file
-- Contains seed data for measurement units adhering to UCUM where applicable
-- and handling dimensionless units for counts/ratings.

-- Clear existing units before inserting new ones to avoid conflicts
-- TRUNCATE TABLE units RESTART IDENTITY CASCADE; -- Use if needed, be cautious

-- Insert units
INSERT INTO units (id, name, abbreviation, unit_category_id, is_default)
VALUES
-- Dimensionless (Counts, Scores, Normalized Ratings)
('1', 'Dimensionless', '1', 'dimensionless', true), -- Default for counts, normalized scores/ratings
('one-to-five', 'One to Five Scale', '1-5', 'dimensionless', false), -- Rating scale, normalization needed
('one-to-ten', 'One to Ten Scale', '1-10', 'dimensionless', false), -- Rating scale, normalization needed
('kg/m2', 'Kilograms per Square Meter', 'kg/m2', 'dimensionless', false), -- For BMI

-- Weight / Mass (Using 'weight' category for context, UCUM units are mass)
('kg', 'Kilogram', 'kg', 'weight', true), -- UCUM base unit for mass
('g', 'Gram', 'g', 'weight', false),
('mg', 'Milligram', 'mg', 'weight', false),
('ug', 'Microgram', 'ug', 'weight', false),
('lb', 'Pound', '[lb_av]', 'weight', false), -- UCUM uses [lb_av] for avoirdupois pound

-- Length
('m', 'Meter', 'm', 'length', true), -- UCUM base unit
('km', 'Kilometer', 'km', 'length', false),
('cm', 'Centimeter', 'cm', 'length', false),
('mm', 'Millimeter', 'mm', 'length', false),
('in', 'Inch', '[in_i]', 'length', false), -- UCUM uses [in_i] for international inch
('ft', 'Foot', '[ft_i]', 'length', false), -- UCUM uses [ft_i] for international foot
('mi', 'Mile', '[mi_i]', 'length', false), -- UCUM uses [mi_i] for international mile

-- Temperature
('Cel', 'Celsius', 'Cel', 'temperature', true), -- UCUM symbol
('degF', 'Fahrenheit', '[degF]', 'temperature', false), -- UCUM symbol

-- Concentration
('mg/dL', 'Milligrams per Deciliter', 'mg/dL', 'concentration', true), -- Common medical unit
('mmol/L', 'Millimoles per Liter', 'mmol/L', 'concentration', false),
('g/L', 'Grams per Liter', 'g/L', 'concentration', false),

-- Cell Count
('/uL', 'Per Microliter', '/uL', 'cell-count', true),

-- Volume
('L', 'Liter', 'L', 'volume', true),
('mL', 'Milliliter', 'mL', 'volume', false),
('dL', 'Deciliter', 'dL', 'volume', false),

-- Energy
('kcal', 'Kilocalorie', 'kcal', 'energy', true), -- Often used in nutrition
('kJ', 'Kilojoule', 'kJ', 'energy', false),

-- Frequency
('/d', 'Per Day', '/d', 'frequency', true),
('/wk', 'Per Week', '/wk', 'frequency', false),
('/mo', 'Per Month', '/mo', 'frequency', false),

-- Rate
('/min', 'Per Minute', '/min', 'rate', true),
('/s', 'Per Second', '/s', 'rate', false),

-- Pressure
('mm[Hg]', 'Millimeters of Mercury', 'mm[Hg]', 'pressure', true), -- UCUM symbol
('atm', 'Atmosphere', 'atm', 'pressure', false),
('Pa', 'Pascal', 'Pa', 'pressure', false),

-- Time
('s', 'Second', 's', 'time', true), -- UCUM base unit
('min', 'Minute', 'min', 'time', false),
('h', 'Hour', 'h', 'time', false),
('d', 'Day', 'd', 'time', false),
('wk', 'Week', 'wk', 'time', false),
('mo', 'Month', 'mo', 'time', false), -- UCUM defines 'mo' as 30 days average
('a', 'Year', 'a', 'time', false), -- UCUM defines 'a' as 365.25 days average

-- Noise
('dB', 'Decibel', 'dB', 'noise', true),

-- Air Quality
('ppm', 'Parts Per Million', 'ppm', 'air-quality', true),
('ppb', 'Parts Per Billion', 'ppb', 'air-quality', false),
('ug/m3', 'Micrograms per Cubic Meter', 'ug/m3', 'air-quality', false),

-- Percentage
('%', 'Percent', '%', 'percentage', true),

-- Currency (Use ISO 4217 codes, UCUM allows arbitrary strings)
('[USD]', 'US Dollar', 'USD', 'currency', true),
('[EUR]', 'Euro', 'EUR', 'currency', false),
('[GBP]', 'British Pound', 'GBP', 'currency', false),

-- Age
('year-age', 'Years (age)', 'a', 'age', true); -- UCUM unit for year
