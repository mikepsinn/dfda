-- Keys with which a laboratory, or another system of the company, sends
-- biomarker reports to the company's care team (POST /api/v1/biomarker-reports,
-- lib/care-team/import.ts). The owner creates a key on the instance page and
-- sees it once; the database keeps only its SHA-256 hash and its first
-- characters, so that the owner can tell the keys apart. A revoked key stops
-- working at once. The import runs on the server, after it checks the key.

CREATE TABLE IF NOT EXISTS public.instance_import_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (name = btrim(name) AND char_length(name) BETWEEN 1 AND 80),
  key_hash TEXT NOT NULL UNIQUE CHECK (key_hash ~ '^[0-9a-f]{64}$'),
  key_prefix TEXT NOT NULL CHECK (char_length(key_prefix) BETWEEN 4 AND 16),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_instance_import_keys_instance_id ON public.instance_import_keys (instance_id);

ALTER TABLE public.instance_import_keys ENABLE ROW LEVEL SECURITY;

-- Only the instance's owner sees, creates and revokes its keys.
DROP POLICY IF EXISTS "Instance owners manage their import keys" ON public.instance_import_keys;
CREATE POLICY "Instance owners manage their import keys" ON public.instance_import_keys
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.instances i WHERE i.id = instance_id AND i.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.instances i WHERE i.id = instance_id AND i.owner_id = auth.uid()));

-- A key cannot change; the owner can only revoke it.
REVOKE UPDATE ON public.instance_import_keys FROM anon, authenticated;
GRANT UPDATE (revoked_at) ON public.instance_import_keys TO authenticated;

-- A report from an import: the key that sent it, and the sender's own id of
-- the report, so that a report sent again is not saved twice.
ALTER TABLE public.biomarker_reports
  ADD COLUMN IF NOT EXISTS import_key_id UUID REFERENCES public.instance_import_keys(id) ON DELETE SET NULL;
ALTER TABLE public.biomarker_reports
  ADD COLUMN IF NOT EXISTS external_id TEXT CHECK (char_length(external_id) BETWEEN 1 AND 200);
CREATE UNIQUE INDEX IF NOT EXISTS idx_biomarker_reports_program_external_id
  ON public.biomarker_reports (program_id, external_id) WHERE external_id IS NOT NULL;

-- As before; a clinician's own upload does not claim to come from an import.
DROP POLICY IF EXISTS "Care teams add shared reports" ON public.biomarker_reports;
CREATE POLICY "Care teams add shared reports" ON public.biomarker_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    public.care_team_can_see(user_id, program_id) AND uploaded_by = auth.uid() AND reviewed_at IS NULL
    AND import_key_id IS NULL AND external_id IS NULL
  );
