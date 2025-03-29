-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Anyone can view doctor profiles"
  ON profiles FOR SELECT
  USING (user_type = 'doctor' AND deleted_at IS NULL);

CREATE POLICY "Anyone can view sponsor profiles"
  ON profiles FOR SELECT
  USING (user_type = 'sponsor' AND deleted_at IS NULL);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id); 