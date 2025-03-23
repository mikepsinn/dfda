-- Variable Categories
--
-- Standard categories for classifying medical variables
-- These categories help organize and group different types of health measurements
--
CREATE TABLE reference.variable_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100),
    icon_name VARCHAR(50),
    font_awesome VARCHAR(50),
    color_hex VARCHAR(7),
    is_public BOOLEAN DEFAULT true,
    sort_order INTEGER,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default categories
INSERT INTO reference.variable_categories 
(name, display_name, icon_name, font_awesome, color_hex, sort_order) VALUES
('ACTIVITIES', 'Activities', 'directions_run', 'fa-running', '#3F51B5', 1),
('BOOKS', 'Books', 'menu_book', 'fa-book', '#9C27B0', 2),
('CAUSES_OF_ILLNESS', 'Causes of Illness', 'healing', 'fa-virus', '#F44336', 3),
('CONDITIONS', 'Conditions', 'sick', 'fa-disease', '#FF9800', 4),
('EMOTIONS', 'Emotions', 'mood', 'fa-smile', '#2196F3', 5),
('ENVIRONMENT', 'Environment', 'wb_sunny', 'fa-sun', '#4CAF50', 6),
('FOODS', 'Foods', 'restaurant_menu', 'fa-utensils', '#8BC34A', 7),
('GOALS', 'Goals', 'grade', 'fa-bullseye', '#CDDC39', 8),
('LOCATIONS', 'Locations', 'place', 'fa-map-marker-alt', '#FFC107', 9),
('MISCELLANY', 'Miscellany', 'category', 'fa-question', '#607D8B', 10),
('MOVIES', 'Movies and TV', 'local_movies', 'fa-film', '#795548', 11),
('MUSIC', 'Music', 'music_note', 'fa-music', '#9E9E9E', 12),
('NUTRIENTS', 'Nutrients', 'sanitizer', 'fa-flask', '#00BCD4', 13),
('PAYMENTS', 'Payments', 'payments', 'fa-credit-card', '#E91E63', 14),
('PHYSICAL_ACTIVITIES', 'Physical Activities', 'fitness_center', 'fa-dumbbell', '#673AB7', 15),
('PHYSIQUE', 'Physique', 'accessibility_new', 'fa-child', '#03A9F4', 16),
('SLEEP', 'Sleep', 'bedtime', 'fa-bed', '#009688', 17),
('SOCIAL_INTERACTIONS', 'Social Interactions', 'groups', 'fa-users', '#FF5722', 18),
('SOFTWARE', 'Software', 'code', 'fa-laptop-code', '#827717', 19),
('SYMPTOMS', 'Symptoms', 'healing', 'fa-stethoscope', '#C62828', 20),
('TREATMENTS', 'Treatments', 'medical_services', 'fa-pills', '#2E7D32', 21),
('VITAL_SIGNS', 'Vital Signs', 'favorite', 'fa-heartbeat', '#D32F2F', 22); 