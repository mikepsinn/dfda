-- The theme of a company instance, besides its brand color: the page
-- background (the text and surface colors follow from it, and a dark
-- background gives a dark site), the font and the corner radius.
-- lib/instance/theme.ts turns these values into the site's CSS variables.
ALTER TABLE public.instances
  ADD COLUMN IF NOT EXISTS background_color TEXT NOT NULL DEFAULT '#ffffff'
    CHECK (background_color ~ '^#[0-9a-f]{6}$'),
  ADD COLUMN IF NOT EXISTS font TEXT NOT NULL DEFAULT 'inter'
    CHECK (font IN ('inter', 'system', 'serif')),
  ADD COLUMN IF NOT EXISTS corner_radius TEXT NOT NULL DEFAULT 'medium'
    CHECK (corner_radius IN ('none', 'small', 'medium', 'large'));
