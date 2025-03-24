-- Unit Categories
--
-- Categories for units of measurement with metadata about aggregation capabilities
--

CREATE TABLE reference.unit_categories (
    id SMALLINT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    can_be_summed BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add table comments
COMMENT ON TABLE reference.unit_categories IS 'Categories for units of measurement with metadata about aggregation capabilities';
COMMENT ON COLUMN reference.unit_categories.can_be_summed IS 'Whether measurements in this category can be meaningfully summed';
COMMENT ON COLUMN reference.unit_categories.sort_order IS 'Display order for the category in lists and selectors';

-- Create indexes
CREATE INDEX idx_unit_categories_name ON reference.unit_categories(name);

-- Seed data for unit categories
INSERT INTO reference.unit_categories (
    id, name, can_be_summed, sort_order, created_at, updated_at
) VALUES
    (1, 'Duration', true, 0, '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    (2, 'Distance', true, 0, '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    (3, 'Weight', true, 0, '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    (4, 'Volume', true, 0, '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    (5, 'Rating', false, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (6, 'Miscellany', true, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (7, 'Energy', true, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (8, 'Proportion', false, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (9, 'Frequency', false, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (10, 'Pressure', false, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (11, 'Temperature', false, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (12, 'Currency', true, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    (13, 'Count', true, 0, '2020-08-12 02:38:03', '2020-08-12 02:38:03');
