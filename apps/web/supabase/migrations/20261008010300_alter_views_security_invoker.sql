-- Apply row-level security inside views that return per-patient rows.
--
-- A view runs with its owner's privileges by default, so these views returned
-- every patient's rows to any caller, including the anonymous REST role. With
-- security_invoker the policies of the underlying tables apply to the caller,
-- so a patient sees only their own conditions. treatment_ratings_stats is not
-- changed: it returns only aggregates across patients.

ALTER VIEW public.patient_conditions_view SET (security_invoker = true);
ALTER VIEW public.pending_actions SET (security_invoker = true);
ALTER VIEW public.patient_eligible_trials_view SET (security_invoker = true);
