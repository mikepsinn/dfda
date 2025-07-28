-- Variable Categories seed file
-- Contains seed data for variable categories

-- Insert variable categories
INSERT INTO variable_categories (id, name, short_description, long_description, emoji, display_order, created_at, updated_at)
VALUES
    ('health-and-physiology', 'Health and Physiology', 'Health states and metrics', 
     'All physical and mental health states and measurements, including symptoms like fatigue, conditions like diabetes, vital signs like heart rate, and biomarkers like blood glucose. Also known as wellness or fitness.', 
     '🩺', 1, '2025-03-28 10:00:00', NULL),
     
    ('intake-and-interventions', 'Intake and Interventions', 'Substances and actions for health', 
     'Everything ingested or applied to influence health, such as food (e.g., calories), drinks (e.g., water), supplements (e.g., vitamin D), medications (e.g., aspirin), and procedures (e.g., surgery). Also known as diet or treatment.', 
     '🍎', 2, '2025-03-28 10:00:00', NULL),
     
    ('activity-and-behavior', 'Activity and Behavior', 'Actions and habits', 
     'All actions, movements, and habits performed, including exercise (e.g., steps, sports like tennis), routines (e.g., brushing teeth), and leisure (e.g., painting). Also known as lifestyle or daily activities.', 
     '🏃', 3, '2025-03-28 10:00:00', NULL),
     
    ('mental-and-emotional-state', 'Mental and Emotional State', 'Feelings and emotions', 
     'Subjective mental experiences and emotional well-being, such as mood ratings, stress levels, or self-reported energy. Also known as mood or emotional health.', 
     '😊', 4, '2025-03-28 10:00:00', NULL),
     
    ('cognitive-performance', 'Cognitive Performance', 'Mental abilities', 
     'Objective mental abilities and brain function, including memory test scores, reaction times, or IQ scores. Also known as brain performance or cognition.', 
     '🧠', 5, '2025-03-28 10:00:00', NULL),
     
    ('media-and-content-engagement', 'Media and Content Engagement', 'Content interaction', 
     'Interaction with informational or entertainment content, such as books read, songs listened to, or shows watched. Also known as media use or consumption.', 
     '📺', 6, '2025-03-28 10:00:00', NULL),
     
    ('social-and-interpersonal', 'Social and Interpersonal', 'Relationships and interactions', 
     'Interactions and relationships with others, including number of conversations, time with friends, or social media chats. Also known as social life or connections.', 
     '👥', 7, '2025-03-28 10:00:00', NULL),
     
    ('environment-and-context', 'Environment and Context', 'External and background factors', 
     'External factors and personal background data, such as air quality, noise levels, age, gender, genetics, or income. Also known as context or surroundings.', 
     '🌍', 8, '2025-03-28 10:00:00', NULL),
     
    ('productivity-and-learning', 'Productivity and Learning', 'Work and education', 
     'Work, education, and goal-oriented efforts, including hours worked, tasks completed, courses finished, or test scores. Also known as productivity or study.', 
     '📚', 9, '2025-03-28 10:00:00', NULL);