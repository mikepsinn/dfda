-- Drop all existing tables in reverse order of dependencies
-- This ensures we don't have dependency conflicts when dropping tables

-- Treatment effectiveness and side effects tables
DROP TABLE IF EXISTS treatment_side_effect_ratings CASCADE;
DROP TABLE IF EXISTS treatment_side_effects CASCADE;
DROP TABLE IF EXISTS treatment_effectiveness_ratings CASCADE;
DROP TABLE IF EXISTS user_treatments CASCADE;
DROP TABLE IF EXISTS treatments CASCADE;
DROP TABLE IF EXISTS treatment_types CASCADE;

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

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  check_in_time TIME, -- Preferred daily check-in time
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- Add UNIQUE constraint
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_goals junction table
CREATE TABLE IF NOT EXISTS user_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE CASCADE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, goal_id)
);

-- Create conditions table with emoji and image fields
CREATE TABLE IF NOT EXISTS conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  category TEXT, -- Ensure category column exists
  emoji TEXT, -- Optional emoji representation
  image_url TEXT, -- Optional URL to an image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_conditions junction table
CREATE TABLE IF NOT EXISTS user_conditions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  condition_id UUID REFERENCES conditions(id) ON DELETE CASCADE,
  severity INTEGER, -- 1-5 scale
  diagnosed_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, condition_id)
);

-- Create notification_preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  web_enabled BOOLEAN DEFAULT TRUE,
  email_enabled BOOLEAN DEFAULT TRUE,
  phone_enabled BOOLEAN DEFAULT FALSE,
  daily_reminder_enabled BOOLEAN DEFAULT TRUE,
  insights_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create health_logs table for daily check-ins
CREATE TABLE IF NOT EXISTS health_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  overall_wellbeing INTEGER, -- 1-10 scale
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- Create symptoms table with emoji and image fields
CREATE TABLE IF NOT EXISTS symptoms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- Add UNIQUE constraint
  category TEXT,
  description TEXT,
  emoji TEXT, -- Optional emoji representation
  image_url TEXT, -- Optional URL to an image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create symptom_logs table
CREATE TABLE IF NOT EXISTS symptom_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  health_log_id UUID REFERENCES health_logs(id) ON DELETE CASCADE,
  symptom_id UUID REFERENCES symptoms(id) ON DELETE CASCADE,
  severity INTEGER NOT NULL, -- 1-5 scale
  time_of_day TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(health_log_id, symptom_id)
);

-- Create meal_types table
CREATE TABLE IF NOT EXISTS meal_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meals table
CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  health_log_id UUID REFERENCES health_logs(id) ON DELETE CASCADE,
  meal_type_id UUID REFERENCES meal_types(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  time_consumed TIME,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create foods table with emoji and image fields
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- Add UNIQUE constraint
  category TEXT,
  calories_per_serving INTEGER,
  protein_grams DECIMAL(10, 2),
  carbs_grams DECIMAL(10, 2),
  fat_grams DECIMAL(10, 2),
  emoji TEXT, -- Optional emoji representation
  image_url TEXT, -- Optional URL to an image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meal_foods junction table
CREATE TABLE IF NOT EXISTS meal_foods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) DEFAULT 1.0,
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(meal_id, food_id)
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE, -- Add UNIQUE constraint
  generic_name TEXT,
  description TEXT,
  typical_dosage TEXT,
  medication_type TEXT,
  emoji TEXT, -- Optional emoji representation
  image_url TEXT, -- Optional URL to an image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_medications table
CREATE TABLE IF NOT EXISTS user_medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES medications(id) ON DELETE CASCADE,
  dosage TEXT,
  frequency TEXT,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, medication_id)
);

-- Create medication_logs table
CREATE TABLE IF NOT EXISTS medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  health_log_id UUID REFERENCES health_logs(id) ON DELETE CASCADE,
  user_medication_id UUID REFERENCES user_medications(id) ON DELETE CASCADE,
  taken BOOLEAN DEFAULT FALSE,
  taken_at TIME,
  dosage_taken TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(health_log_id, user_medication_id)
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create file_types table
CREATE TABLE IF NOT EXISTS file_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploads table
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  health_log_id UUID REFERENCES health_logs(id) ON DELETE SET NULL,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  meal_id UUID REFERENCES meals(id) ON DELETE SET NULL,
  file_type_id UUID REFERENCES file_types(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create upload_metadata table
CREATE TABLE IF NOT EXISTS upload_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  upload_id UUID REFERENCES uploads(id) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(upload_id, key)
);

-- Create insight_types table
CREATE TABLE IF NOT EXISTS insight_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create insights table
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  insight_type_id UUID REFERENCES insight_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence FLOAT, -- AI confidence score (0-1)
  start_date DATE, -- Period this insight covers
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create insight_entities table to track what the insight relates to
CREATE TABLE IF NOT EXISTS insight_entities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL, -- 'food', 'medication', 'symptom', 'condition'
  entity_id UUID NOT NULL, -- ID of the related entity
  relationship TEXT, -- 'positive', 'negative', 'neutral'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification_types table
CREATE TABLE IF NOT EXISTS notification_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type_id UUID REFERENCES notification_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Create call_purposes table
CREATE TABLE IF NOT EXISTS call_purposes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create call_statuses table
CREATE TABLE IF NOT EXISTS call_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scheduled_calls table
CREATE TABLE IF NOT EXISTS scheduled_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  call_purpose_id UUID REFERENCES call_purposes(id) ON DELETE SET NULL,
  call_status_id UUID REFERENCES call_statuses(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  call_sid TEXT, -- For tracking with telephony provider
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integration_providers table
CREATE TABLE IF NOT EXISTS integration_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  api_base_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integration_statuses table
CREATE TABLE IF NOT EXISTS integration_statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES integration_providers(id) ON DELETE CASCADE,
  status_id UUID REFERENCES integration_statuses(id) ON DELETE SET NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, provider_id)
);

-- Create integration_data_types table
CREATE TABLE IF NOT EXISTS integration_data_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create integration_data table
CREATE TABLE IF NOT EXISTS integration_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  data_type_id UUID REFERENCES integration_data_types(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  numeric_value DECIMAL(10, 2),
  text_value TEXT,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
