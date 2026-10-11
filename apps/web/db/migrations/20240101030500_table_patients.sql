-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  height NUMERIC,
  weight NUMERIC,
  blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies TEXT[],
  medications TEXT[],
  deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
); 