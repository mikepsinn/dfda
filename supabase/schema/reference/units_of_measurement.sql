-- Units of Measurement
--
-- Standard units for measuring health variables
-- Includes conversion factors, display information, and metadata
--

CREATE TABLE reference.units_of_measurement (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(255),
    name VARCHAR(100) NOT NULL UNIQUE,
    descriptive_name VARCHAR(255),
    abbreviation VARCHAR(20),
    code_system VARCHAR(255),
    definition TEXT,
    synonym VARCHAR(255),
    status VARCHAR(50),
    kind_of_quantity VARCHAR(255),
    concept_id VARCHAR(255),
    dimension VARCHAR(255),
    unit_category_id SMALLINT REFERENCES reference.unit_categories(id),
    minimum_value DECIMAL,
    maximum_value DECIMAL,
    maximum_daily_value DECIMAL,
    conversion_steps JSONB,
    filling_type filling_type_enum NOT NULL DEFAULT 'none',
    filling_value DECIMAL,
    scale scale_type_enum NOT NULL DEFAULT 'ratio',
    advanced BOOLEAN NOT NULL DEFAULT false,
    manual_tracking BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    slug VARCHAR(200) UNIQUE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for commonly queried fields
CREATE INDEX idx_units_category ON reference.units_of_measurement(unit_category_id);
CREATE INDEX idx_units_code ON reference.units_of_measurement(code);
CREATE INDEX idx_units_status ON reference.units_of_measurement(status);

-- Add table comments
COMMENT ON TABLE reference.units_of_measurement IS 'Standard units for measuring health variables including conversion factors and metadata';
COMMENT ON COLUMN reference.units_of_measurement.filling_type IS 'Specifies how periods of missing data should be treated';
COMMENT ON COLUMN reference.units_of_measurement.scale IS 'Measurement scale type: nominal (categorical), ordinal (ordered), interval (equal intervals), or ratio (true zero)';
COMMENT ON COLUMN reference.units_of_measurement.advanced IS 'Advanced units are rarely used and should be hidden or at bottom of selector lists';
COMMENT ON COLUMN reference.units_of_measurement.manual_tracking IS 'Include in selector when manually recording measurements';
COMMENT ON COLUMN reference.units_of_measurement.maximum_daily_value IS 'Maximum aggregated measurement value over a single day';

-- Seed data for standard units
INSERT INTO reference.units_of_measurement (
    name, abbreviation, unit_category_id, minimum_value, maximum_value, 
    filling_type, scale, advanced, manual_tracking, conversion_steps, maximum_daily_value
) VALUES
-- Duration units
('Seconds', 's', 1, 0, NULL, 'zero', 'ratio', true, false, '[]', 86400),
('Minutes', 'min', 1, 0, 10080, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":60}]', 1440),
('Hours', 'h', 1, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":3600}]', 24),
('Milliseconds', 'ms', 1, 0, 864000000, 'zero', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', 86400000),
('Days', 'd', 1, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":86400}]', 1),
('Weeks', 'wk', 1, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":604800}]', 1),
('Months', 'mo', 1, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":2592000}]', 1),
('Years', 'a', 1, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":31536000}]', 1),

-- Distance units
('Meters', 'm', 2, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Kilometers', 'km', 2, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1000}]', NULL),
('Centimeters', 'cm', 2, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.01}]', NULL),
('Millimeters', 'mm', 2, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', NULL),
('Miles', 'mi', 2, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1609.34}]', NULL),
('Inches', 'in', 2, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.0254}]', NULL),
('Feet', 'ft', 2, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.3048}]', NULL),

-- Area units
('Square Meters', 'm²', 14, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Square Centimeters', 'cm²', 14, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.0001}]', NULL),
('Square Millimeters', 'mm²', 14, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.000001}]', NULL),
('Square Inches', 'in²', 14, 0, NULL, 'none', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.00064516}]', NULL),

-- Weight units
('Kilograms', 'kg', 3, 0, NULL, 'none', 'ratio', true, true, '[]', NULL),
('Grams', 'g', 3, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":0.001}]', NULL),
('Milligrams', 'mg', 3, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":1.0e-6}]', 1000000),
('Micrograms', 'mcg', 3, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1.0e-6}]', 10000),
('Pounds', 'lb', 3, 0, 1000, 'none', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.453592}]', NULL),
('Ounces', 'oz', 3, 0, NULL, 'none', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.0283495}]', NULL),
('Metric Tons', 't', 3, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1000}]', NULL),
('Nanograms', 'ng', 3, 0, NULL, 'zero', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1.0e-12}]', NULL),

-- Volume units
('Milliliters', 'mL', 4, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":0.001}]', 1000000),
('Liters', 'L', 4, 0, NULL, 'zero', 'ratio', true, true, '[]', 10),
('Ounces', 'oz', 4, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.0295735}]', NULL),
('Quarts', 'qt', 4, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.946353}]', NULL),
('Cubic Meters', 'm³', 4, 0, NULL, 'zero', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1000}]', NULL),
('Cubic Centimeters', 'cm³', 4, 0, NULL, 'zero', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', NULL),
('Fluid Ounces', 'fl_oz', 4, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.0295735}]', NULL),
('Milliliters per Hour', 'mL/h', 4, 0, NULL, 'zero', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', NULL),

-- Rating units
('1 to 5 Rating', '/5', 5, 1, 5, 'none', 'ordinal', false, true, '[{"operation":"MULTIPLY","value":25},{"operation":"ADD","value":-25}]', NULL),
('0 to 1 Rating', '/1', 5, 0, 1, 'none', 'ordinal', true, false, '[{"operation":"MULTIPLY","value":100}]', NULL),
('1 to 10 Rating', '/10', 5, 1, 10, 'none', 'ordinal', false, true, '[{"operation":"MULTIPLY","value":11.111111111111},{"operation":"ADD","value":-11.111111111111}]', NULL),
('-4 to 4 Rating', '-4 to 4', 5, -4, 4, 'none', 'ordinal', true, false, '[{"operation":"ADD","value":4},{"operation":"MULTIPLY","value":12.5}]', NULL),
('0 to 5 Rating', '/6', 5, 0, 5, 'none', 'ordinal', true, false, '[{"operation":"MULTIPLY","value":20}]', NULL),
('1 to 3 Rating', '/3', 5, 1, 3, 'none', 'ordinal', true, true, '[{"operation":"MULTIPLY","value":50},{"operation":"ADD","value":-50}]', NULL),

-- Proportion units
('Percent', '%', 8, NULL, NULL, 'none', 'interval', true, true, '[]', NULL),

-- Miscellany units
('Index', 'index', 6, 0, NULL, 'none', 'ordinal', true, false, '[]', NULL),
('Degrees East', 'degrees east', 6, NULL, NULL, 'none', 'interval', true, false, '[]', NULL),
('Degrees North', 'degrees north', 6, NULL, NULL, 'none', 'interval', true, false, '[]', NULL),
('% Recommended Daily Allowance', '%RDA', 6, 0, NULL, 'none', 'ratio', true, false, '[]', 10000),
('International Units', 'IU', 6, 0, NULL, 'zero', 'ratio', true, true, '[]', NULL),
('Parts per Million', 'ppm', 6, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Decibels', 'dB', 6, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),

-- Energy units
('Kilocalories', 'kcal', 7, NULL, NULL, 'none', 'ratio', true, false, '[]', 20000),
('Calories', 'cal', 7, NULL, NULL, 'none', 'ratio', true, false, '[]', 20000),
('Gigabecquerel', 'GBq', 7, NULL, NULL, 'none', 'interval', true, true, '[]', NULL),

-- Frequency/Rate units
('per Minute', '/minute', 9, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Meters per Second', 'm/s', 9, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Beats per Minute', 'bpm', 9, 20, 300, 'none', 'ratio', true, false, '[]', NULL),
('Miles per Hour', 'mph', 9, 0, NULL, 'none', 'ratio', true, true, '[]', NULL),
('per Second', '/s', 9, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('per Hour', '/h', 9, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Kilometers per Hour', 'km/h', 9, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.277778}]', NULL),

-- Pressure units
('Millimeters Merc', 'mmHg', 10, 1, 100000, 'none', 'ratio', true, true, '[{"operation":"MULTIPLY","value":133.32239}]', NULL),
('Pascal', 'Pa', 10, 10132, 1113250, 'none', 'ratio', true, false, '[]', NULL),
('Torr', 'torr', 10, 76, 7600, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":133.322}]', NULL),
('Millibar', 'mbar', 10, 101, 10130, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":133.32239}]', NULL),
('Hectopascal', 'hPa', 10, 101.32, 11132.5, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":100}]', NULL),
('Kilopascals', 'kPa', 10, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1000}]', NULL),
('Atmospheres', 'atm', 10, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":101325}]', NULL),

-- Temperature units
('Degrees Fahrenheit', 'F', 11, -87, 214, 'none', 'interval', true, true, '[{"operation":"ADD","value":-32},{"operation":"MULTIPLY","value":0.55555555555556}]', NULL),
('Degrees Celsius', 'C', 11, -66, 101, 'none', 'interval', true, true, '[]', NULL),

-- Currency units
('Dollars', '$', 12, NULL, NULL, 'zero', 'ratio', true, false, '[]', NULL),

-- Concentration units
('Moles per Liter', 'mol/L', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Millimoles per Liter', 'mmol/L', 15, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', NULL),
('Units per Liter', 'U/L', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Milligrams per Milliliter', 'mg/mL', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Nanograms per Milliliter', 'ng/mL', 15, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":1e-6}]', NULL),
('Millimoles per Kilogram', 'mmol/kg', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Milligrams per Deciliter', 'mg/dL', 15, 0, NULL, 'none', 'ratio', true, true, '[{"operation":"MULTIPLY","value":0.01}]', NULL),
('Micrograms per Milliliter', 'μg/mL', 15, 0, NULL, 'none', 'ratio', true, false, '[{"operation":"MULTIPLY","value":0.001}]', NULL),
('Grams per Liter', 'g/L', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),
('Moles per Cubic Meter', 'mol/m³', 15, 0, NULL, 'none', 'ratio', true, false, '[]', NULL),

-- Count units
('Tablets', 'tablets', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 20),
('Units', 'units', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', NULL),
('Puffs', 'puffs', 13, 0, 100, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', NULL),
('Applications', 'applications', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 20),
('Yes/No', 'yes/no', 13, 0, 1, 'zero', 'ordinal', false, true, '[{"operation":"MULTIPLY","value":1}]', NULL),
('Count', 'count', 13, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":1}]', NULL),
('Pills', 'pills', 13, 0, 20, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 100),
('Capsules', 'capsules', 13, 0, 1000, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 20),
('Pieces', 'pieces', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 100),
('Event', 'event', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', NULL),
('Serving', 'serving', 13, 0, NULL, 'zero', 'ratio', false, true, '[{"operation":"MULTIPLY","value":1}]', 40),
('Sprays', 'sprays', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 50),
('Drops', 'drops', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', 100),
('Doses', 'dose', 13, 0, NULL, 'zero', 'ratio', true, true, '[{"operation":"MULTIPLY","value":1}]', NULL); 