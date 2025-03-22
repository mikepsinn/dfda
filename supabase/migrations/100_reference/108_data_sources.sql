-- Add data sources table
CREATE TABLE IF NOT EXISTS reference.data_sources (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_type text NOT NULL CHECK (source_type IN (
        'data_import',      -- File uploads and documents
        'oauth_client',     -- OAuth2 client applications
        'integration',      -- Third-party API integrations
        'manual_entry',     -- Direct user input
        'device',          -- Connected devices/sensors
        'calculated'       -- Derived/calculated from other measurements
    )),
    -- Source-specific identifiers (only one should be set based on source_type)
    import_id uuid REFERENCES personal.data_imports(id) ON DELETE SET NULL,
    client_id uuid REFERENCES oauth2.clients(id) ON DELETE SET NULL,
    integration_id text, -- External integration identifier
    device_id text,     -- Device identifier
    -- Common metadata
    name text NOT NULL,  -- Display name of the source
    description text,    -- Optional description
    metadata jsonb,      -- Additional source-specific metadata
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    -- Ensure only one identifier is set based on source_type
    CONSTRAINT valid_source_reference CHECK (
        CASE source_type
            WHEN 'data_import' THEN (import_id IS NOT NULL AND client_id IS NULL AND integration_id IS NULL AND device_id IS NULL)
            WHEN 'oauth_client' THEN (import_id IS NULL AND client_id IS NOT NULL AND integration_id IS NULL AND device_id IS NULL)
            WHEN 'integration' THEN (import_id IS NULL AND client_id IS NULL AND integration_id IS NOT NULL AND device_id IS NULL)
            WHEN 'device' THEN (import_id IS NULL AND client_id IS NULL AND integration_id IS NULL AND device_id IS NOT NULL)
            ELSE (import_id IS NULL AND client_id IS NULL AND integration_id IS NULL AND device_id IS NULL)
        END
    )
);

-- Add indexes for data sources
CREATE INDEX idx_data_sources_source_type ON reference.data_sources(source_type);
CREATE INDEX idx_data_sources_import_id ON reference.data_sources(import_id) WHERE import_id IS NOT NULL;
CREATE INDEX idx_data_sources_client_id ON reference.data_sources(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX idx_data_sources_integration_id ON reference.data_sources(integration_id) WHERE integration_id IS NOT NULL;
CREATE INDEX idx_data_sources_device_id ON reference.data_sources(device_id) WHERE device_id IS NOT NULL;

-- Add comment explaining the data sources system
COMMENT ON TABLE reference.data_sources IS 
'Centralized registry of all data sources that can contribute measurements to the system. 
This includes file imports, OAuth clients, third-party integrations, devices, and manual entry.
Each source type has its own identifier pattern and metadata structure.'; 