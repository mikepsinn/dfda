-- A company's byline, such as "by Acme Health". The site shows it under the name
-- on the home page and after the name in the footer, so that the name can stay
-- short everywhere else (titles, emails, consent text). Null: no byline.
ALTER TABLE public.instances ADD COLUMN IF NOT EXISTS byline TEXT
  CHECK (byline = btrim(byline) AND char_length(byline) BETWEEN 1 AND 60);

-- Demo mode: visitors of the company's site can try it as a demo patient and as
-- a demo clinician of its care team (lib/demo/instance.ts). The owner can turn
-- it on only while nobody has joined the company's programs, and it turns off
-- when the first real person joins, so that the shared demo accounts never see
-- a real person.
ALTER TABLE public.instances ADD COLUMN IF NOT EXISTS demo_enabled BOOLEAN NOT NULL DEFAULT false;
