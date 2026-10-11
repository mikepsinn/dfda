-- Programs of a company instance: what a person tracks while they use the
-- company's product (doses, check-ins, blood markers) and when they measure
-- again. People join a program; the company sees totals only, never one
-- person's records (lib/programs/dashboard.ts). Demo scope: see
-- docs/PRODUCT-ARCHITECTURE.md.
CREATE TABLE IF NOT EXISTS public.instance_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  slug TEXT NOT NULL
    CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' AND char_length(slug) BETWEEN 3 AND 60),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  summary TEXT CHECK (char_length(summary) <= 300),
  follow_up_weeks INTEGER NOT NULL DEFAULT 12 CHECK (follow_up_weeks BETWEEN 2 AND 52),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (instance_id, slug)
);

-- One thing to track in a program. A dose has a schedule and an optional
-- usual amount; a check-in has a schedule and a better direction; a lab is
-- entered at the start and at the follow-up, and has a better direction.
CREATE TABLE IF NOT EXISTS public.instance_program_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.instance_programs(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('dose', 'check_in', 'lab')),
  global_variable_id TEXT NOT NULL REFERENCES public.global_variables(id) ON DELETE RESTRICT,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly')),
  better TEXT CHECK (better IN ('higher', 'lower', 'neither')),
  default_value DOUBLE PRECISION,
  position INTEGER NOT NULL DEFAULT 0,
  CHECK ((kind = 'lab') = (frequency IS NULL)),
  CHECK ((kind = 'dose') = (better IS NULL)),
  CHECK (kind = 'dose' OR default_value IS NULL),
  UNIQUE (program_id, global_variable_id)
);

CREATE TABLE IF NOT EXISTS public.program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.instance_programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (program_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_instance_programs_instance_id ON public.instance_programs (instance_id);
CREATE INDEX IF NOT EXISTS idx_instance_program_items_program_id ON public.instance_program_items (program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_id ON public.program_enrollments (user_id);

ALTER TABLE public.instance_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instance_program_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

-- Programs and their items are public: the instance site shows them to visitors.
DROP POLICY IF EXISTS "Anyone can read programs" ON public.instance_programs;
CREATE POLICY "Anyone can read programs" ON public.instance_programs
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Instance owners manage their programs" ON public.instance_programs;
CREATE POLICY "Instance owners manage their programs" ON public.instance_programs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.instances i WHERE i.id = instance_id AND i.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.instances i WHERE i.id = instance_id AND i.owner_id = auth.uid()));

DROP POLICY IF EXISTS "Anyone can read program items" ON public.instance_program_items;
CREATE POLICY "Anyone can read program items" ON public.instance_program_items
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Instance owners manage their program items" ON public.instance_program_items;
CREATE POLICY "Instance owners manage their program items" ON public.instance_program_items
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.instance_programs p JOIN public.instances i ON i.id = p.instance_id
    WHERE p.id = program_id AND i.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.instance_programs p JOIN public.instances i ON i.id = p.instance_id
    WHERE p.id = program_id AND i.owner_id = auth.uid()
  ));

-- People see, create and leave only their own enrollments. The instance
-- owner has no policy here: the dashboard reads totals on the server after it
-- checks ownership.
DROP POLICY IF EXISTS "Users manage their own enrollments" ON public.program_enrollments;
CREATE POLICY "Users manage their own enrollments" ON public.program_enrollments
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
