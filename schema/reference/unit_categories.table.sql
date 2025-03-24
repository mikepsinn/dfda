-- Table: reference.unit_categories

CREATE TABLE reference.unit_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    can_be_summed BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    ucum_dimension VARCHAR(20),
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN reference.unit_categories.ucum_dimension IS 'The UCUM/IUPAC dimension code (e.g., L for length, M for mass, T for time, etc.)';
