-- Insert some common symptoms with emojis and empty image URLs
INSERT INTO symptoms (name, category, description, emoji, image_url) VALUES
  ('Headache', 'Pain', 'Pain in the head or upper neck', '🤕', NULL),
  ('Fatigue', 'Energy', 'Feeling of tiredness or exhaustion', '😴', NULL),
  ('Nausea', 'Digestive', 'Feeling of sickness with an inclination to vomit', '🤢', NULL),
  ('Joint Pain', 'Pain', 'Pain in one or more joints', '🦴', NULL),
  ('Insomnia', 'Sleep', 'Difficulty falling or staying asleep', '😳', NULL),
  ('Anxiety', 'Mental', 'Feeling of worry, nervousness, or unease', '😰', NULL),
  ('Bloating', 'Digestive', 'Swelling or distension of the abdomen', '🫃', NULL),
  ('Dizziness', 'Neurological', 'Feeling faint, woozy, or unsteady', '💫', NULL)
ON CONFLICT (name) DO UPDATE SET 
  emoji = EXCLUDED.emoji,
  image_url = EXCLUDED.image_url;
