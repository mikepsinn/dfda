-- Create oauth_scopes table
CREATE TABLE IF NOT EXISTS oauth_scopes (
  scope TEXT PRIMARY KEY,
  description TEXT
);

-- Add comments for clarity
COMMENT ON TABLE oauth_scopes IS 'Defines the available OAuth 2.0 scopes for API access.';
COMMENT ON COLUMN oauth_scopes.scope IS 'The unique identifier for the scope (e.g., profile, email).';
COMMENT ON COLUMN oauth_scopes.description IS 'A human-readable description of what the scope grants access to.';
