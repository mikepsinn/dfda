-- A company site's demo (lib/demo/instance.ts) stays on beside real members.
-- Any visitor can sign in as the demo clinician, so the demo clinician sees
-- the demo patient only; the real care team does not see the demo patient.
-- Both demo accounts have an email at example.com that the app derives from
-- the instance (lib/demo/instance-accounts.ts). Nobody else can own those
-- emails: sign-up with a password is off, and a sign-in link to example.com
-- reaches nobody.

-- The email of an instance's demo account; p_role is 'patient' or 'clinician'.
CREATE OR REPLACE FUNCTION public.instance_demo_email(p_instance_id UUID, p_role TEXT)
RETURNS TEXT
LANGUAGE sql IMMUTABLE
AS $$
  SELECT 'demo-' || p_role || '-' || p_instance_id::text || '@example.com'
$$;

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
    JOIN public.profiles viewer ON viewer.id = c.user_id
    JOIN public.profiles person ON person.id = e.user_id
    WHERE e.user_id = p_user_id
      AND e.program_id = p_program_id
      AND e.shared_with_care_team_at IS NOT NULL
      AND c.user_id = auth.uid()
      AND (viewer.email IS NOT DISTINCT FROM public.instance_demo_email(p.instance_id, 'clinician'))
        = (person.email IS NOT DISTINCT FROM public.instance_demo_email(p.instance_id, 'patient'))
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
    AND (
      (SELECT viewer.email FROM public.profiles viewer WHERE viewer.id = auth.uid())
        IS NOT DISTINCT FROM public.instance_demo_email(p_instance_id, 'clinician')
    ) = (pr.email IS NOT DISTINCT FROM public.instance_demo_email(p_instance_id, 'patient'))
  ORDER BY u.name, pr.email
$$;
