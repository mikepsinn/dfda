-- Insert some common conditions with emojis and empty image URLs
INSERT INTO conditions (name, description, category, emoji, image_url) VALUES
  ('Diabetes', 'Diabetes mellitus', 'Metabolic', '🩸', NULL),
  ('Hypertension', 'High blood pressure', 'Cardiovascular', '❤️', NULL),
  ('Arthritis', 'Joint inflammation', 'Musculoskeletal', '🦴', NULL),
  ('Depression', 'Clinical depression', 'Mental Health', '😔', NULL),
  ('Anxiety', 'Anxiety disorder', 'Mental Health', '😰', NULL),
  ('IBS', 'Irritable Bowel Syndrome', 'Digestive', '🚽', NULL),
  ('Migraine', 'Recurrent headaches', 'Neurological', '🤕', NULL),
  ('Asthma', 'Chronic lung condition', 'Respiratory', '🫁', NULL)
ON CONFLICT (name) DO UPDATE SET 
  emoji = EXCLUDED.emoji,
  image_url = EXCLUDED.image_url;
