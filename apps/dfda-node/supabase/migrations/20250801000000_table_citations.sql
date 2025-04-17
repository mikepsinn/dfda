-- Migration: Create citations table and related enum

-- 1. Create citation_type enum
CREATE TYPE citation_type AS ENUM (
  'journal_article',
  'book',
  'webpage',
  'fda_label',
  'usda_entry',
  'other'
);

-- 2. Create citations table
CREATE TABLE citations (
  id TEXT PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),

  type citation_type NOT NULL,
  title TEXT NULL,
  authors TEXT[] NULL,
  journal_or_publisher TEXT NULL,
  publication_year INT NULL,
  volume TEXT NULL,
  issue TEXT NULL,
  pages TEXT NULL,
  doi TEXT NULL, -- Digital Object Identifier
  pmid TEXT NULL, -- PubMed ID
  url TEXT NULL, -- Link to article/source
  abstract TEXT NULL,
  retrieved_at TIMESTAMPTZ NULL, -- Primarily for webpages

  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;

-- Add trigger for automatic updated_at timestamp
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON citations
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- 3. Add Indexes for faster lookups and uniqueness
CREATE INDEX idx_citations_doi ON citations(doi);
CREATE INDEX idx_citations_pmid ON citations(pmid);
CREATE INDEX idx_citations_url ON citations(url);

-- Add unique constraints where applicable (DOI and PMID should be unique if provided)
CREATE UNIQUE INDEX idx_unique_citations_doi ON citations(doi) WHERE doi IS NOT NULL;
CREATE UNIQUE INDEX idx_unique_citations_pmid ON citations(pmid) WHERE pmid IS NOT NULL;

-- 4. Add Policies (Example: Allow authenticated users to read, restrict writes)
-- Adjust policies based on your actual application needs
CREATE POLICY "Allow read access to authenticated users" ON citations
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Example: Allow admin role (or specific service role) to insert/update/delete
-- CREATE POLICY "Allow admin management access" ON citations
--   FOR ALL
--   USING (is_claims_admin()) -- Assuming a function is_claims_admin() checks user role
--   WITH CHECK (is_claims_admin()); 