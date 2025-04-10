-- Insert some common goals
INSERT INTO goals (name, description) VALUES
  ('Improve Energy', 'Increase overall energy levels'),
  ('Reduce Pain', 'Decrease chronic pain'),
  ('Enhance Mood', 'Improve mood and emotional wellbeing'),
  ('Better Sleep', 'Improve sleep quality and duration'),
  ('Reduce Anxiety', 'Decrease anxiety symptoms'),
  ('Improve Digestion', 'Enhance digestive health')
ON CONFLICT (name) DO NOTHING;

-- Insert some common conditions
INSERT INTO conditions (name, description, category) VALUES
  ('Diabetes', 'Diabetes mellitus', 'Metabolic'),
  ('Hypertension', 'High blood pressure', 'Cardiovascular'),
  ('Arthritis', 'Joint inflammation', 'Musculoskeletal'),
  ('Depression', 'Clinical depression', 'Mental Health'),
  ('Anxiety', 'Anxiety disorder', 'Mental Health'),
  ('IBS', 'Irritable Bowel Syndrome', 'Digestive'),
  ('Migraine', 'Recurrent headaches', 'Neurological'),
  ('Asthma', 'Chronic lung condition', 'Respiratory')
ON CONFLICT (name) DO NOTHING;

-- Insert some common symptoms
INSERT INTO symptoms (name, category, description) VALUES
  ('Headache', 'Pain', 'Pain in the head or upper neck'),
  ('Fatigue', 'Energy', 'Feeling of tiredness or exhaustion'),
  ('Nausea', 'Digestive', 'Feeling of sickness with an inclination to vomit'),
  ('Joint Pain', 'Pain', 'Pain in one or more joints'),
  ('Insomnia', 'Sleep', 'Difficulty falling or staying asleep'),
  ('Anxiety', 'Mental', 'Feeling of worry, nervousness, or unease'),
  ('Bloating', 'Digestive', 'Swelling or distension of the abdomen'),
  ('Dizziness', 'Neurological', 'Feeling faint, woozy, or unsteady')
ON CONFLICT (name) DO NOTHING;

-- NEW SAMPLE DATA FOR TREATMENT TABLES

-- Insert sample treatments
INSERT INTO treatments (name, treatment_type_id, description, typical_dosage, frequency, duration) VALUES
  ('Ibuprofen', (SELECT id FROM treatment_types WHERE name = 'Medication'), 'Non-steroidal anti-inflammatory drug (NSAID)', '200-400mg', 'Every 4-6 hours as needed', 'Short-term use recommended'),
  ('Vitamin D3', (SELECT id FROM treatment_types WHERE name = 'Supplement'), 'Fat-soluble vitamin important for bone health', '1000-2000 IU', 'Daily', 'Ongoing'),
  ('Cognitive Behavioral Therapy', (SELECT id FROM treatment_types WHERE name = 'Lifestyle'), 'Psychotherapy focused on changing negative thought patterns', 'N/A', 'Weekly sessions', '12-20 weeks'),
  ('Mediterranean Diet', (SELECT id FROM treatment_types WHERE name = 'Diet'), 'Diet rich in fruits, vegetables, whole grains, and healthy fats', 'N/A', 'Daily', 'Ongoing'),
  ('Yoga', (SELECT id FROM treatment_types WHERE name = 'Physical Therapy'), 'Mind-body practice combining physical postures, breathing exercises, and meditation', '30-60 minutes', '2-3 times per week', 'Ongoing'),
  ('Acupuncture', (SELECT id FROM treatment_types WHERE name = 'Alternative'), 'Traditional Chinese medicine involving thin needles inserted at specific points on the body', '30-60 minute sessions', 'Weekly or biweekly', 'Varies by condition')
ON CONFLICT (name) DO NOTHING;
