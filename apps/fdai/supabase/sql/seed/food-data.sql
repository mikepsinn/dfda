-- Insert some common foods with emojis and empty image URLs
INSERT INTO foods (name, category, calories_per_serving, protein_grams, carbs_grams, fat_grams, emoji, image_url) VALUES
  ('Apple', 'Fruit', 95, 0.5, 25.0, 0.3, '🍎', NULL),
  ('Banana', 'Fruit', 105, 1.3, 27.0, 0.4, '🍌', NULL),
  ('Chicken Breast', 'Protein', 165, 31.0, 0.0, 3.6, '🍗', NULL),
  ('Salmon', 'Protein', 206, 22.0, 0.0, 13.0, '🐟', NULL),
  ('Broccoli', 'Vegetable', 55, 3.7, 11.0, 0.6, '🥦', NULL),
  ('Brown Rice', 'Grain', 216, 5.0, 45.0, 1.8, '🍚', NULL),
  ('Eggs', 'Protein', 78, 6.3, 0.6, 5.3, '🥚', NULL),
  ('Avocado', 'Fruit', 234, 2.9, 12.0, 21.0, '🥑', NULL),
  ('Spinach', 'Vegetable', 23, 2.9, 3.6, 0.4, '🍃', NULL),
  ('Almonds', 'Nuts', 164, 6.0, 6.1, 14.0, '🥜', NULL)
ON CONFLICT (name) DO UPDATE SET 
  emoji = EXCLUDED.emoji,
  image_url = EXCLUDED.image_url;
