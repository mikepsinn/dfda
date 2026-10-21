-- Invitations to the care team of an instance.
--
-- The owner adds a clinician by email. The app does not tell the owner whether
-- an account uses that email: it saves an invitation and emails a link. The
-- person opens the link, signs in or signs up with that email, and joins the
-- care team. Only the account whose verified email is the invitation's email
-- can accept it.

CREATE TABLE IF NOT EXISTS public.care_team_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID NOT NULL REFERENCES public.instances(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email = lower(btrim(email)) AND char_length(email) BETWEEN 3 AND 320 AND email LIKE '%_@_%'),
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (instance_id, email)
);

CREATE INDEX IF NOT EXISTS idx_care_team_invitations_email ON public.care_team_invitations (email);

-- The signed-in user's email in lower case when it is verified; null otherwise.
CREATE OR REPLACE FUNCTION public.current_verified_email()
RETURNS TEXT
LANGUAGE sql STABLE
SECURITY DEFINER SET search_path = public
AS $$
  SELECT lower(u.email) FROM public.users u WHERE u.id = auth.uid() AND u."emailVerified"
$$;

-- Accepts an invitation for the signed-in user: they join the care team and
-- the invitation is removed. Returns the instance's id; null when the
-- invitation does not exist or is for another email.
CREATE OR REPLACE FUNCTION public.accept_care_team_invitation(p_invitation_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_instance_id UUID;
BEGIN
  DELETE FROM public.care_team_invitations
  WHERE id = p_invitation_id AND email = public.current_verified_email()
  RETURNING instance_id INTO v_instance_id;
  IF v_instance_id IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.instance_clinicians (instance_id, user_id)
  VALUES (v_instance_id, auth.uid())
  ON CONFLICT DO NOTHING;
  RETURN v_instance_id;
END;
$$;

ALTER TABLE public.care_team_invitations ENABLE ROW LEVEL SECURITY;

-- The owner invites, sees and cancels; the invited person sees their own
-- invitations. Nobody else, the clinicians of the care team included.
DROP POLICY IF EXISTS "Instance owners manage their invitations" ON public.care_team_invitations;
CREATE POLICY "Instance owners manage their invitations" ON public.care_team_invitations
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.instances i WHERE i.id = instance_id AND i.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.instances i WHERE i.id = instance_id AND i.owner_id = auth.uid()));

DROP POLICY IF EXISTS "People see their invitations" ON public.care_team_invitations;
CREATE POLICY "People see their invitations" ON public.care_team_invitations
  FOR SELECT TO authenticated
  USING (email = public.current_verified_email());
