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