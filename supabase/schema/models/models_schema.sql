-- Create models schema for health and economic impact modeling
CREATE SCHEMA IF NOT EXISTS models;

COMMENT ON SCHEMA models IS 'Schema for storing model parameters, simulation runs, and their outputs';
 
-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA models TO authenticated; 