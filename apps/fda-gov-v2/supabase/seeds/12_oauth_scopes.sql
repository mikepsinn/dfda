-- OAuth Scopes seed file
-- Contains seed data for OAuth scopes

-- Insert OAuth scopes
INSERT INTO oauth_scopes (scope, description) VALUES
  ('openid', 'Access basic user profile information'),
  ('profile', 'Access detailed user profile information'),
  ('email', 'Access user email address'),
  ('offline_access', 'Allow issuance of refresh tokens for long-lived access'),
  ('trials:read', 'Read trial information'),
  ('patients:read', 'Read patient data user has access to'),
  ('measurements:read', 'Read measurement data user has access to'),
  ('measurements:write', 'Submit measurement data on behalf of the user')
ON CONFLICT (scope) DO NOTHING;
