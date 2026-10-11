-- Branded instances: a company's own branding of the app (name, logo, color,
-- products) on a preview link, a subdomain or its own domain. This is the
-- demo of white labeling (docs/PRODUCT-ARCHITECTURE.md); it changes branding
-- only, and all instances share the same data and sign-in.
CREATE TABLE IF NOT EXISTS public.instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 40),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  tagline TEXT CHECK (char_length(tagline) <= 200),
  logo_url TEXT CHECK (logo_url ~ '^https://'),
  primary_color TEXT NOT NULL DEFAULT '#6d4df6' CHECK (primary_color ~ '^#[0-9a-f]{6}$'),
  products TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality(products) <= 8),
  custom_domain TEXT UNIQUE
    CHECK (custom_domain ~ '^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$'),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_instances_owner_id ON public.instances (owner_id);

ALTER TABLE public.instances ENABLE ROW LEVEL SECURITY;

-- Branding is public: every page reads it to show the right name and colors.
DROP POLICY IF EXISTS "Anyone can read instance branding" ON public.instances;
CREATE POLICY "Anyone can read instance branding" ON public.instances
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only the owner creates, changes and deletes an instance.
DROP POLICY IF EXISTS "Owners manage their instances" ON public.instances;
CREATE POLICY "Owners manage their instances" ON public.instances
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());
