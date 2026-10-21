-- Unit Categories seed file
-- Contains seed data for unit categories

-- Insert unit categories
INSERT INTO unit_categories (id, name, description, emoji)
VALUES
('weight', 'Weight', 'Units of weight (often used interchangeably with mass in context)', '⚖️'),
('mass', 'Mass', 'Units of mass (distinct from weight)', '⚖️'),
('length', 'Length', 'Units of length or distance', '📏'),
('temperature', 'Temperature', 'Units of temperature', '🌡️'),
('concentration', 'Concentration', 'Units of concentration (e.g., mg/dL, mmol/L)', '🧪'),
('cell-count', 'Cell Count', 'Units for cell counts (e.g., per microliter)', '🔬'),
('volume', 'Volume', 'Units of volume', '💧'),
('energy', 'Energy', 'Units of energy (e.g., kcal, kJ)', '⚡'),
('frequency', 'Frequency', 'Units of frequency (e.g., per day, per week)', '🔄'),
('rate', 'Rate', 'Units of rate (e.g., per minute)', '💓'),
('pressure', 'Pressure', 'Units of pressure (e.g., mmHg)', '💨'),
('time', 'Time', 'Units of time duration', '⏱️'),
('noise', 'Noise', 'Units of noise level (e.g., decibels)', '🔊'),
('air-quality', 'Air Quality', 'Units for air quality metrics (e.g., ppm)', '🌬️'),
('percentage', 'Percentage', 'Units representing a percentage', '%'),
('currency', 'Currency', 'Units representing currency', '💰'),
('age', 'Age', 'Units representing age (e.g., years)', '🎂'),
('dimensionless', 'Dimensionless', 'Units for counts, scores, and normalized ratings (typically 1)', '🔢');

-- Blood marker units (also in migration 20261011020000 for existing databases)
INSERT INTO unit_categories (id, name, description, emoji)
VALUES
('enzyme-activity', 'Enzyme Activity', 'Units of enzyme activity in blood (e.g., U/L)', '🧪'),
('mass-concentration', 'Mass Concentration', 'Mass of a substance per volume (e.g., ng/mL, mg/L)', '🧪');

-- Lab test units (also in migration 20261021040000 for existing databases)
INSERT INTO unit_categories (id, name, description, emoji)
VALUES
('velocity', 'Velocity', 'Distance per time (e.g., mm/h for the erythrocyte sedimentation rate)', '🧪'),
('international-units-concentration', 'International Units Concentration', 'Biological activity per volume in international units (e.g., µIU/mL)', '🧪'),
('filtration-rate', 'Filtration Rate', 'Volume filtered per time per standard body surface area (e.g., mL/min/1.73m²)', '🧪');
