-- Seed: reference.unit_categories
-- Seed data for reference.unit_categories

INSERT INTO reference.unit_categories (
    id, name, can_be_summed, sort_order, ucum_dimension, created_at, updated_at
) VALUES
    -- Existing categories with UCUM dimensions
    ('duration', 'Duration', true, 10, 'T', '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    ('distance', 'Distance', true, 20, 'L', '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    ('weight', 'Weight', true, 30, 'M', '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    ('volume', 'Volume', true, 40, 'L3', '2020-08-12 02:38:02', '2020-08-12 02:38:02'),
    ('rating', 'Rating', false, 50, '1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('miscellany', 'Miscellany', true, 60, NULL, '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('energy', 'Energy', true, 70, 'L2MT-2', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('proportion', 'Proportion', false, 80, '1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('frequency', 'Frequency', false, 90, 'T-1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('pressure', 'Pressure', false, 100, 'L-1MT-2', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('temperature', 'Temperature', false, 110, 'Θ', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('currency', 'Currency', true, 120, '[arb]', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('count', 'Count', true, 130, '1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('area', 'Area', true, 140, 'L2', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('concentration', 'Concentration', false, 150, 'L-3N', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('osmolality', 'Osmolality', false, 155, 'N.M-1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),

    -- Additional UCUM categories
    ('electric_current', 'Electric Current', false, 160, 'I', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('substance', 'Amount of Substance', true, 170, 'N', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('luminous_intensity', 'Luminous Intensity', false, 180, 'J', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('velocity', 'Velocity', false, 190, 'LT-1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('acceleration', 'Acceleration', false, 200, 'LT-2', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('force', 'Force', true, 210, 'LMT-2', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('power', 'Power', true, 220, 'L2MT-3', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('electric_potential', 'Electric Potential', false, 230, 'L2MT-3I-1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('electric_resistance', 'Electric Resistance', false, 240, 'L2MT-3I-2', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('magnetic_flux', 'Magnetic Flux', false, 250, 'L2MT-2I-1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('magnetic_flux_density', 'Magnetic Flux Density', false, 260, 'MT-2I-1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('radioactivity', 'Radioactivity', false, 270, 'T-1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('absorbed_dose', 'Absorbed Dose', false, 280, 'L2T-2', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('catalytic_activity', 'Catalytic Activity', false, 290, 'NT-1', '2020-08-12 02:38:03', '2020-08-12 02:38:03'),
    ('information', 'Information', true, 300, '[bit]', '2020-08-12 02:38:03', '2020-08-12 02:38:03');
