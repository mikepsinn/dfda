-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Anyone can view provider profiles"
  ON profiles FOR SELECT
  USING (user_type = 'provider' AND deleted_at IS NULL);

CREATE POLICY "Anyone can view sponsor profiles"
  ON profiles FOR SELECT
  USING (user_type = 'research-partner' AND deleted_at IS NULL);

CREATE POLICY "Anyone can view developer profiles"
  ON profiles FOR SELECT
  USING (user_type = 'developer' AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Add policy for inserting own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id); 