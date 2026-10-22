-- The email address where a company's members get help. The company's site
-- shows it on the sign-in page, and the emails that the site sends for the
-- company (sign-in links, care team invitations) use it as the reply address.
-- Null when the company gives none: the site then shows no help address.
ALTER TABLE public.instances ADD COLUMN IF NOT EXISTS support_email TEXT
  CHECK (support_email = lower(btrim(support_email)) AND char_length(support_email) BETWEEN 3 AND 320 AND support_email LIKE '%_@_%');
