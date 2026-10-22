-- Content pages of a company instance: what the company measures, an FAQ, its
-- own terms and privacy policy, and so on. The owner writes each page in
-- Markdown, and the company's site shows it at /pages/{slug}. A page in the
-- menu is linked in the site's header on wide screens, and every page is linked
-- in its footer. A page with the slug "terms" or "privacy" takes the place of the
-- network's page at /terms or /privacy on the company's site.

CREATE TABLE IF NOT EXISTS public.instance_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  slug TEXT NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 60),
  title TEXT NOT NULL CHECK (title = btrim(title) AND char_length(title) BETWEEN 1 AND 120),
  body TEXT NOT NULL CHECK (char_length(body) <= 50000),
  in_menu BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (instance_id, slug)
);

DROP TRIGGER IF EXISTS set_instance_pages_updated_at ON public.instance_pages;
CREATE TRIGGER set_instance_pages_updated_at
  BEFORE UPDATE ON public.instance_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.instance_pages ENABLE ROW LEVEL SECURITY;

-- The pages are public, like the branding: every visitor of the company's site reads them.
DROP POLICY IF EXISTS "Anyone can read instance pages" ON public.instance_pages;
CREATE POLICY "Anyone can read instance pages" ON public.instance_pages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only the instance's owner writes, changes and deletes its pages.
DROP POLICY IF EXISTS "Instance owners manage their pages" ON public.instance_pages;
CREATE POLICY "Instance owners manage their pages" ON public.instance_pages
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.instances i WHERE i.id = instance_id AND i.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.instances i WHERE i.id = instance_id AND i.owner_id = auth.uid()));
