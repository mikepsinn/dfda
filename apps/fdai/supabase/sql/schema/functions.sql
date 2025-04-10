-- Drop existing functions and triggers
DROP FUNCTION IF EXISTS public.is_admin CASCADE;
DROP FUNCTION IF EXISTS public.reset_database_schema CASCADE;
DROP FUNCTION IF EXISTS public.clear_all_data CASCADE;
DROP FUNCTION IF EXISTS public.seed_reference_data CASCADE;
DROP FUNCTION IF EXISTS public.create_admin_account CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_admin BOOLEAN;
BEGIN
  -- In a real application, you would check against an admin table or role
  -- For this example, we'll use a simple check based on email domain
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND email LIKE '%admin%'
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset the database schema
CREATE OR REPLACE FUNCTION public.reset_database_schema()
RETURNS VOID AS $$
BEGIN
  -- This function should only be callable by admins
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: only admins can reset the database schema';
  END IF;

  -- Drop all tables in reverse order of dependencies
  -- Integration tables
  DROP TABLE IF EXISTS integration_data CASCADE;
  DROP TABLE IF EXISTS integration_data_types CASCADE;
  DROP TABLE IF EXISTS integrations CASCADE;
  DROP TABLE IF EXISTS integration_statuses CASCADE;
  DROP TABLE IF EXISTS integration_providers CASCADE;
  
  -- Call tables
  DROP TABLE IF EXISTS scheduled_calls CASCADE;
  DROP TABLE IF EXISTS call_statuses CASCADE;
  DROP TABLE IF EXISTS call_purposes CASCADE;
  
  -- Notification tables
  DROP TABLE IF EXISTS notifications CASCADE;
  DROP TABLE IF EXISTS notification_types CASCADE;
  
  -- Insight tables
  DROP TABLE IF EXISTS insight_entities CASCADE;
  DROP TABLE IF EXISTS insights CASCADE;
  DROP TABLE IF EXISTS insight_types CASCADE;
  
  -- File tables
  DROP TABLE IF EXISTS upload_metadata CASCADE;
  DROP TABLE IF EXISTS uploads CASCADE;
  DROP TABLE IF EXISTS file_types CASCADE;
  
  -- Message tables
  DROP TABLE IF EXISTS messages CASCADE;
  DROP TABLE IF EXISTS conversations CASCADE;
  
  -- Health tracking tables
  DROP TABLE IF EXISTS medication_logs CASCADE;
  DROP TABLE IF EXISTS user_medications CASCADE;
  DROP TABLE IF EXISTS medications CASCADE;
  DROP TABLE IF EXISTS meal_foods CASCADE;
  DROP TABLE IF EXISTS foods CASCADE;
  DROP TABLE IF EXISTS meals CASCADE;
  DROP TABLE IF EXISTS meal_types CASCADE;
  DROP TABLE IF EXISTS symptom_logs CASCADE;
  DROP TABLE IF EXISTS symptoms CASCADE;
  DROP TABLE IF EXISTS health_logs CASCADE;
  
  -- User data tables
  DROP TABLE IF EXISTS notification_preferences CASCADE;
  DROP TABLE IF EXISTS user_conditions CASCADE;
  DROP TABLE IF EXISTS conditions CASCADE;
  DROP TABLE IF EXISTS user_goals CASCADE;
  DROP TABLE IF EXISTS goals CASCADE;
  DROP TABLE IF EXISTS profiles CASCADE;

  -- Re-run the schema creation script
  -- In a real application, you would have a more sophisticated way to do this
  -- For example, you might use a migration tool or run the schema.sql file
  
  -- For this example, we'll just raise a notice
  RAISE NOTICE 'Database schema has been reset. Please run the schema.sql script to recreate it.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear all data but keep the schema
CREATE OR REPLACE FUNCTION public.clear_all_data()
RETURNS VOID AS $$
BEGIN
  -- This function should only be callable by admins
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: only admins can clear all data';
  END IF;

  -- Truncate all tables in reverse order of dependencies
  -- Integration tables
  TRUNCATE TABLE integration_data CASCADE;
  TRUNCATE TABLE integrations CASCADE;
  
  -- Call tables
  TRUNCATE TABLE scheduled_calls CASCADE;
  
  -- Notification tables
  TRUNCATE TABLE notifications CASCADE;
  
  -- Insight tables
  TRUNCATE TABLE insight_entities CASCADE;
  TRUNCATE TABLE insights CASCADE;
  
  -- File tables
  TRUNCATE TABLE upload_metadata CASCADE;
  TRUNCATE TABLE uploads CASCADE;
  
  -- Message tables
  TRUNCATE TABLE messages CASCADE;
  TRUNCATE TABLE conversations CASCADE;
  
  -- Health tracking tables
  TRUNCATE TABLE medication_logs CASCADE;
  TRUNCATE TABLE user_medications CASCADE;
  TRUNCATE TABLE meal_foods CASCADE;
  TRUNCATE TABLE meals CASCADE;
  TRUNCATE TABLE symptom_logs CASCADE;
  TRUNCATE TABLE health_logs CASCADE;
  
  -- User data tables
  TRUNCATE TABLE user_conditions CASCADE;
  TRUNCATE TABLE user_goals CASCADE;
  TRUNCATE TABLE notification_preferences CASCADE;
  TRUNCATE TABLE profiles CASCADE;

  -- Preserve the profiles for existing users
  INSERT INTO profiles (id, email)
  SELECT id, email FROM auth.users;
  
  -- Recreate notification preferences for existing users
  INSERT INTO notification_preferences (user_id)
  SELECT id FROM profiles;

  RAISE NOTICE 'All data has been cleared while preserving the schema.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to seed reference data
CREATE OR REPLACE FUNCTION public.seed_reference_data()
RETURNS VOID AS $$
BEGIN
  -- This function should only be callable by admins
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Permission denied: only admins can seed reference data';
  END IF;

  -- Insert reference data for meal types
  INSERT INTO meal_types (name) VALUES 
    ('Breakfast'), 
    ('Lunch'), 
    ('Dinner'), 
    ('Snack'), 
    ('Other')
  ON CONFLICT (name) DO NOTHING;

  -- Insert reference data for file types
  INSERT INTO file_types (name, mime_type) VALUES 
    ('Image', 'image/*'),
    ('PDF', 'application/pdf'),
    ('CSV', 'text/csv'),
    ('Text', 'text/plain'),
    ('Other', 'application/octet-stream')
  ON CONFLICT (name) DO NOTHING;

  -- Insert reference data for insight types
  INSERT INTO insight_types (name, description) VALUES 
    ('Food Correlation', 'Correlation between foods and symptoms'),
    ('Medication Efficacy', 'Effectiveness of medications'),
    ('Symptom Pattern', 'Patterns in symptom occurrence'),
    ('Lifestyle Impact', 'Impact of lifestyle factors on health'),
    ('General Recommendation', 'General health recommendations')
  ON CONFLICT (name) DO NOTHING;

  -- Insert reference data for notification types
  INSERT INTO notification_types (name, description) VALUES 
    ('Check-in Reminder', 'Reminder to complete daily health check-in'),
    ('Insight Alert', 'New health insight available'),
    ('Medication Reminder', 'Reminder to take medication'),
    ('System Update', 'System or feature update notification')
  ON CONFLICT (name) DO NOTHING;

  -- Insert reference data for call purposes
  INSERT INTO call_purposes (name, description) VALUES 
    ('Check-in', 'Regular health check-in call'),
    ('Follow-up', 'Follow-up on previous health issues'),
    ('Medication Reminder', 'Reminder to take medications'),
    ('Insight Discussion', 'Discuss new health insights')
  ON CONFLICT (name) DO NOTHING;

  -- Insert reference data for call statuses
  INSERT INTO call_statuses (name, description) VALUES 
    ('Scheduled', 'Call is scheduled'),
    ('Completed', 'Call was completed successfully'),
    ('Failed', 'Call failed to connect'),
    ('Cancelled', 'Call was cancelled')
  ON CONFLICT (name) DO NOTHING;

  -- Insert reference data for integration providers
  INSERT INTO integration_providers (name, description) VALUES 
    ('Fitbit', 'Fitbit activity and health tracking'),
    ('Apple Health', 'Apple Health data'),
    ('Google Fit', 'Google Fit activity and health data'),
    ('Oura Ring', 'Oura Ring sleep and activity data')
  ON CONFLICT (name) DO NOTHING;

  -- Insert reference data for integration statuses
  INSERT INTO integration_statuses (name, description) VALUES 
    ('Active', 'Integration is active and syncing'),
    ('Expired', 'Integration token has expired'),
    ('Revoked', 'Integration access was revoked'),
    ('Error', 'Integration is experiencing errors')
  ON CONFLICT (name) DO NOTHING;

  -- Insert reference data for integration data types
  INSERT INTO integration_data_types (name, description) VALUES 
    ('Steps', 'Daily step count'),
    ('Heart Rate', 'Heart rate measurements'),
    ('Sleep', 'Sleep duration and quality'),
    ('Weight', 'Body weight measurements'),
    ('Activity', 'Physical activity data')
  ON CONFLICT (name) DO NOTHING;

  RAISE NOTICE 'Reference data has been seeded successfully.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create and confirm an admin account (for development only)
CREATE OR REPLACE FUNCTION public.create_admin_account(admin_email TEXT, admin_password TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
  is_success BOOLEAN := FALSE;
BEGIN
  -- This function should only be used in development
  -- In production, you would use proper user management
  
  -- Check if user already exists
  SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
  
  IF user_id IS NULL THEN
    -- Create the user
    INSERT INTO auth.users (
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_sent_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin
    ) VALUES (
      admin_email,
      crypt(admin_password, gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"is_admin":true}',
      FALSE
    )
    RETURNING id INTO user_id;
    
    -- Create profile
    INSERT INTO public.profiles (id, email, name)
    VALUES (user_id, admin_email, 'Admin User');
    
    is_success := TRUE;
  ELSE
    -- User exists, ensure they're confirmed
    UPDATE auth.users
    SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = user_id;
    
    is_success := TRUE;
  END IF;
  
  RETURN is_success;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Also create default notification preferences
  INSERT INTO public.notification_preferences (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
