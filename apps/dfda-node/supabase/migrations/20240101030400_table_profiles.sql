-- Create custom enum type for user roles
CREATE TYPE user_type_enum AS ENUM (
  'patient',
  'provider',
  'research-partner',
  'admin',
  'developer'
);

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  user_type user_type_enum, -- Removed NOT NULL constraint, updated type name
  avatar_url TEXT,
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 