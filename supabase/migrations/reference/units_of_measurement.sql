-- Units of Measurement
--
-- Standard units for measuring health variables
-- Includes conversion factors and display information
--
CREATE TABLE reference.units_of_measurement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    abbreviation VARCHAR(20),
    category VARCHAR(50),
    minimum_value DECIMAL,
    maximum_value DECIMAL,
    conversion_steps JSONB,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed data for standard units
INSERT INTO reference.units_of_measurement (name, abbreviation, category, minimum_value, maximum_value) VALUES
-- Mass/Weight units
('milligram', 'mg', 'mass', 0, 1000),
('gram', 'g', 'mass', 0, 1000),
('kilogram', 'kg', 'mass', 0, 1000),
('pound', 'lb', 'mass', 0, 1000),
('ounce', 'oz', 'mass', 0, 1000),

-- Volume units
('milliliter', 'mL', 'volume', 0, 500),
('liter', 'L', 'volume', 0, 500),
('cubic centimeter', 'cc', 'volume', 0, 500),
('fluid ounce', 'fl oz', 'volume', 0, 500),

-- Length units
('millimeter', 'mm', 'length', NULL, NULL),
('centimeter', 'cm', 'length', NULL, NULL),
('meter', 'm', 'length', NULL, NULL),
('inch', 'in', 'length', NULL, NULL),
('foot', 'ft', 'length', NULL, NULL),

-- Temperature units
('celsius', '°C', 'temperature', -20, 50),
('fahrenheit', '°F', 'temperature', -4, 122),
('kelvin', 'K', 'temperature', NULL, NULL),

-- Pressure units
('millimeter of mercury', 'mmHg', 'pressure', 0, 300),
('kilopascal', 'kPa', 'pressure', NULL, NULL),
('pascal', 'Pa', 'pressure', NULL, NULL),

-- Concentration units
('milligrams per deciliter', 'mg/dL', 'concentration', NULL, NULL),
('millimoles per liter', 'mmol/L', 'concentration', NULL, NULL),
('micrograms per milliliter', 'µg/mL', 'concentration', NULL, NULL),

-- Ratio units
('percentage', '%', 'ratio', 0, 100),
('ratio', '', 'ratio', NULL, NULL),

-- Count units
('count', '', 'count', 0, NULL),
('steps', 'steps', 'count', 0, NULL),

-- Rate units
('per minute', '/min', 'rate', NULL, NULL),
('beats per minute', 'bpm', 'rate', 0, 300),
('breaths per minute', 'br/min', 'rate', 0, 100); 