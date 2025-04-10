-- Insert default meal types
INSERT INTO meal_types (name) VALUES 
  ('Breakfast'), 
  ('Lunch'), 
  ('Dinner'), 
  ('Snack'), 
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- Insert default file types
INSERT INTO file_types (name, mime_type) VALUES 
  ('Image', 'image/*'),
  ('PDF', 'application/pdf'),
  ('CSV', 'text/csv'),
  ('Text', 'text/plain'),
  ('Other', 'application/octet-stream')
ON CONFLICT (name) DO NOTHING;

-- Insert default insight types
INSERT INTO insight_types (name, description) VALUES 
  ('Food Correlation', 'Correlation between foods and symptoms'),
  ('Medication Efficacy', 'Effectiveness of medications'),
  ('Symptom Pattern', 'Patterns in symptom occurrence'),
  ('Lifestyle Impact', 'Impact of lifestyle factors on health'),
  ('General Recommendation', 'General health recommendations')
ON CONFLICT (name) DO NOTHING;

-- Insert default notification types
INSERT INTO notification_types (name, description) VALUES 
  ('Check-in Reminder', 'Reminder to complete daily health check-in'),
  ('Insight Alert', 'New health insight available'),
  ('Medication Reminder', 'Reminder to take medication'),
  ('System Update', 'System or feature update notification')
ON CONFLICT (name) DO NOTHING;

-- Insert default call purposes
INSERT INTO call_purposes (name, description) VALUES 
  ('Check-in', 'Regular health check-in call'),
  ('Follow-up', 'Follow-up on previous health issues'),
  ('Medication Reminder', 'Reminder to take medications'),
  ('Insight Discussion', 'Discuss new health insights')
ON CONFLICT (name) DO NOTHING;

-- Insert default call statuses
INSERT INTO call_statuses (name, description) VALUES 
  ('Scheduled', 'Call is scheduled'),
  ('Completed', 'Call was completed successfully'),
  ('Failed', 'Call failed to connect'),
  ('Cancelled', 'Call was cancelled')
ON CONFLICT (name) DO NOTHING;

-- Insert default integration providers
INSERT INTO integration_providers (name, description) VALUES 
  ('Fitbit', 'Fitbit activity and health tracking'),
  ('Apple Health', 'Apple Health data'),
  ('Google Fit', 'Google Fit activity and health data'),
  ('Oura Ring', 'Oura Ring sleep and activity data')
ON CONFLICT (name) DO NOTHING;

-- Insert default integration statuses
INSERT INTO integration_statuses (name, description) VALUES 
  ('Active', 'Integration is active and syncing'),
  ('Expired', 'Integration token has expired'),
  ('Revoked', 'Integration access was revoked'),
  ('Error', 'Integration is experiencing errors')
ON CONFLICT (name) DO NOTHING;

-- Insert default integration data types
INSERT INTO integration_data_types (name, description) VALUES 
  ('Steps', 'Daily step count'),
  ('Heart Rate', 'Heart rate measurements'),
  ('Sleep', 'Sleep duration and quality'),
  ('Weight', 'Body weight measurements'),
  ('Activity', 'Physical activity data')
ON CONFLICT (name) DO NOTHING;

-- Insert default treatment types
INSERT INTO treatment_types (name, description) VALUES
  ('Medication', 'Pharmaceutical treatments'),
  ('Supplement', 'Vitamins, minerals, and other dietary supplements'),
  ('Physical Therapy', 'Therapeutic exercises and physical treatments'),
  ('Diet', 'Dietary interventions and food-based treatments'),
  ('Lifestyle', 'Lifestyle modifications and behavioral changes'),
  ('Alternative', 'Alternative and complementary therapies')
ON CONFLICT (name) DO NOTHING;
