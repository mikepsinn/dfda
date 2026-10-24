-- A company site's demo (lib/demo/instance.ts) stays on beside real members.
-- Any visitor can sign in as the demo clinician, so the demo clinician sees
-- the demo patient only; the real care team does not see the demo patient.
--
-- The demo accounts are known by their user ids, which nobody can change: a
-- user can change their profile, email included, but not this table.

-- The demo patient and the demo clinician of each instance. Only the server's
-- admin client reads and writes the table (no policies for users).
CREATE TABLE IF NOT EXISTS public.instance_demo_accounts (
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('patient', 'clinician')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (instance_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_instance_demo_accounts_user_id ON public.instance_demo_accounts (user_id);

ALTER TABLE public.instance_demo_accounts ENABLE ROW LEVEL SECURITY;

-- Whether the user is the instance's demo account in this role.
CREATE OR REPLACE FUNCTION public.is_instance_demo_account(p_instance_id UUID, p_user_id UUID, p_role TEXT)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.instance_demo_accounts d
    WHERE d.instance_id = p_instance_id AND d.user_id = p_user_id AND d.role = p_role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.is_instance_demo_account(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;

-- Whether the signed-in user is on the care team of the program's instance,
-- the person shares their reports in that program, and both are demo
-- accounts or neither is.
CREATE OR REPLACE FUNCTION public.care_team_can_see(p_user_id UUID, p_program_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.program_enrollments e
    JOIN public.instance_programs p ON p.id = e.program_id
    JOIN public.instance_clinicians c ON c.instance_id = p.instance_id
    WHERE e.user_id = p_user_id
      AND e.program_id = p_program_id
      AND e.shared_with_care_team_at IS NOT NULL
      AND c.user_id = auth.uid()
      AND public.is_instance_demo_account(p.instance_id, c.user_id, 'clinician')
        = public.is_instance_demo_account(p.instance_id, e.user_id, 'patient')
  )
$$;

-- The people who share their reports with the instance's care team, for a
-- clinician of that care team; no rows for anyone else. The demo clinician
-- gets the demo patient only, and the real care team never gets the demo
-- patient.
CREATE OR REPLACE FUNCTION public.care_team_patients(p_instance_id UUID)
RETURNS TABLE (
  enrollment_id UUID,
  user_id UUID,
  name TEXT,
  email TEXT,
  program_id UUID,
  started_at TIMESTAMP WITH TIME ZONE,
  shared_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT e.id, e.user_id, u.name, pr.email, e.program_id, e.started_at, e.shared_with_care_team_at
  FROM public.program_enrollments e
  JOIN public.instance_programs p ON p.id = e.program_id
  JOIN public.profiles pr ON pr.id = e.user_id
  LEFT JOIN public.users u ON u.id = e.user_id
  WHERE p.instance_id = p_instance_id
    AND e.shared_with_care_team_at IS NOT NULL
    AND pr.deleted_at IS NULL
    AND public.is_care_team_member(p_instance_id)
    AND public.is_instance_demo_account(p_instance_id, auth.uid(), 'clinician')
      = public.is_instance_demo_account(p_instance_id, e.user_id, 'patient')
  ORDER BY u.name, pr.email
$$;
