-- Insert sample treatments with emojis and empty image URLs
INSERT INTO treatments (name, treatment_type_id, description, typical_dosage, frequency, duration, emoji, image_url) VALUES
  ('Ibuprofen', (SELECT id FROM treatment_types WHERE name = 'Medication'), 'Non-steroidal anti-inflammatory drug (NSAID)', '200-400mg', 'Every 4-6 hours as needed', 'Short-term use recommended', '💊', NULL),
  ('Vitamin D3', (SELECT id FROM treatment_types WHERE name = 'Supplement'), 'Fat-soluble vitamin important for bone health', '1000-2000 IU', 'Daily', 'Ongoing', '☀️', NULL),
  ('Cognitive Behavioral Therapy', (SELECT id FROM treatment_types WHERE name = 'Lifestyle'), 'Psychotherapy focused on changing negative thought patterns', 'N/A', 'Weekly sessions', '12-20 weeks', '🧠', NULL),
  ('Mediterranean Diet', (SELECT id FROM treatment_types WHERE name = 'Diet'), 'Diet rich in fruits, vegetables, whole grains, and healthy fats', 'N/A', 'Daily', 'Ongoing', '🫒', NULL),
  ('Yoga', (SELECT id FROM treatment_types WHERE name = 'Physical Therapy'), 'Mind-body practice combining physical postures, breathing exercises, and meditation', '30-60 minutes', '2-3 times per week', 'Ongoing', '🧘', NULL),
  ('Acupuncture', (SELECT id FROM treatment_types WHERE name = 'Alternative'), 'Traditional Chinese medicine involving thin needles inserted at specific points on the body', '30-60 minute sessions', 'Weekly or biweekly', 'Varies by condition', '🪡', NULL)
ON CONFLICT (name) DO UPDATE SET 
  emoji = EXCLUDED.emoji,
  image_url = EXCLUDED.image_url;

-- Insert common treatment side effects with emojis and empty image URLs
INSERT INTO treatment_side_effects (name, description, category, emoji, image_url) VALUES
  ('Nausea', 'Feeling of sickness with an inclination to vomit', 'Digestive', '🤢', NULL),
  ('Headache', 'Pain in the head or upper neck', 'Neurological', '🤕', NULL),
  ('Fatigue', 'Feeling of tiredness or exhaustion', 'Energy', '😴', NULL),
  ('Dizziness', 'Feeling faint, woozy, or unsteady', 'Neurological', '💫', NULL),
  ('Insomnia', 'Difficulty falling or staying asleep', 'Sleep', '😳', NULL),
  ('Dry Mouth', 'Insufficient saliva production', 'Digestive', '🏜️', NULL),
  ('Constipation', 'Difficulty passing stool or infrequent bowel movements', 'Digestive', '🪨', NULL),
  ('Diarrhea', 'Loose, watery stools', 'Digestive', '💦', NULL),
  ('Rash', 'Skin irritation or inflammation', 'Dermatological', '🔴', NULL),
  ('Mood Changes', 'Alterations in mood, including anxiety or depression', 'Mental', '🎭', NULL)
ON CONFLICT (name) DO UPDATE SET 
  emoji = EXCLUDED.emoji,
  image_url = EXCLUDED.image_url;
