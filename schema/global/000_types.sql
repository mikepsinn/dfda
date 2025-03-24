-- Global Types and Enums
--
-- Shared custom types and enums used across multiple tables
-- These types should be created before other migrations that reference them
--

-- Filling type for handling missing data
CREATE TYPE filling_type_enum AS ENUM (
    'zero',        -- Fill gaps with zero
    'none',        -- Leave gaps as is
    'interpolation', -- Use interpolation between points
    'value'         -- Use a specific value
);

-- Valence type for positive/negative indicators
CREATE TYPE valence_type_enum AS ENUM (
    'positive',  -- Higher values are better
    'negative',  -- Lower values are better
    'neutral'    -- No inherent good/bad value
);

-- Frequency type for occurrence patterns
CREATE TYPE frequency_type_enum AS ENUM (
    'always',    -- Consistently occurs
    'sometimes', -- Occasionally occurs
    'never'      -- Does not occur
);

-- Operation type for combining measurements
CREATE TYPE combination_operation_enum AS ENUM (
    'sum',  -- Add values together
    'mean'  -- Take average of values
);

-- Scale type for measurement scales
CREATE TYPE scale_type_enum AS ENUM (
    'nominal',   -- Categories with no order
    'ordinal',   -- Ordered categories
    'interval',  -- Equal intervals, no true zero
    'ratio'      -- Equal intervals with true zero
);

COMMENT ON TYPE filling_type_enum IS 'Specifies how periods of missing data should be treated';
COMMENT ON TYPE valence_type_enum IS 'Indicates whether higher or lower values are considered better';
COMMENT ON TYPE frequency_type_enum IS 'Describes how often something occurs or should occur';
COMMENT ON TYPE combination_operation_enum IS 'Specifies how multiple measurements should be combined';
COMMENT ON TYPE scale_type_enum IS 'Defines the type of measurement scale being used'; 