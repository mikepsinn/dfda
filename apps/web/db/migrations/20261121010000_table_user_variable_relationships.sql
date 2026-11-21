-- A person's own predictor and outcome relationships, from their recorded data
-- (docs/MIGRATION.md, "Patient app modeled on QuantiModo", phase 4). The
-- calculation is in packages/analysis and the job that keeps these rows current
-- in apps/web/lib/analysis. One row for each predictor and outcome that the
-- person's data can relate; the job replaces the person's rows after their
-- measurements change.
CREATE TABLE IF NOT EXISTS public.user_variable_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  predictor_global_variable_id TEXT NOT NULL REFERENCES public.global_variables(id) ON DELETE CASCADE,
  outcome_global_variable_id TEXT NOT NULL REFERENCES public.global_variables(id) ON DELETE CASCADE,
  -- The version of the calculation (packages/analysis METHOD_VERSION).
  method_version TEXT NOT NULL,
  -- The window that was found: the outcome on a day is paired with the
  -- predictor over the duration of action ending onset_delay_days earlier.
  onset_delay_days INTEGER NOT NULL,
  duration_of_action_days INTEGER NOT NULL,
  -- The windows tried, each with its pairs, correlations, effective pairs and
  -- own p-value ([{ onsetDelayDays, durationOfActionDays, pairs, correlation,
  -- trendAdjustedCorrelation, effectivePairs, pValue }]), and how many
  -- independent windows they count as.
  windows_tried INTEGER NOT NULL,
  windows JSONB NOT NULL,
  effective_windows DOUBLE PRECISION NOT NULL,
  number_of_pairs INTEGER NOT NULL,
  -- The pairs counted as independent, allowing for runs of similar days.
  effective_pairs DOUBLE PRECISION NOT NULL,
  first_pair_date DATE NOT NULL,
  last_pair_date DATE NOT NULL,
  predictor_measurements INTEGER NOT NULL,
  outcome_measurements INTEGER NOT NULL,
  predictor_days INTEGER NOT NULL,
  outcome_days INTEGER NOT NULL,
  -- Pearson's correlation of the pairs in the found window; the same once each
  -- series' straight-line trend over the days is removed; and with the roles
  -- swapped (the outcome before the predictor) in the same window.
  correlation DOUBLE PRECISION NOT NULL,
  trend_adjusted_correlation DOUBLE PRECISION NOT NULL,
  reverse_correlation DOUBLE PRECISION,
  -- The chance of a trend-adjusted correlation this strong in any of the
  -- windows tried when the variables are unrelated, allowing for runs of
  -- similar days and for the number of windows tried.
  p_value DOUBLE PRECISION NOT NULL,
  -- The averages below are in these units (the person's unit for each variable).
  predictor_unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
  outcome_unit_id TEXT NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
  -- The pairs with the predictor below its average, and at or above it.
  low_predictor_pairs INTEGER NOT NULL,
  high_predictor_pairs INTEGER NOT NULL,
  predictor_low_average DOUBLE PRECISION NOT NULL,
  predictor_high_average DOUBLE PRECISION NOT NULL,
  outcome_with_low_predictor DOUBLE PRECISION NOT NULL,
  outcome_with_high_predictor DOUBLE PRECISION NOT NULL,
  -- The predictor's average in pairs with the outcome above, and below, its average.
  value_predicting_high_outcome DOUBLE PRECISION,
  value_predicting_low_outcome DOUBLE PRECISION,
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_variable_relationships_pair UNIQUE (user_id, predictor_global_variable_id, outcome_global_variable_id)
);

CREATE INDEX IF NOT EXISTS idx_user_variable_relationships_outcome
  ON public.user_variable_relationships (user_id, outcome_global_variable_id);

-- A person reads their own results. Only the server writes them, so that a
-- result always comes from the person's measurements.
ALTER TABLE public.user_variable_relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read their own relationships" ON public.user_variable_relationships;
CREATE POLICY "Users read their own relationships" ON public.user_variable_relationships
  FOR SELECT
  USING (user_id = auth.uid());

-- The people whose measurements changed since their relationships were last
-- computed. A trigger on measurements adds or refreshes the row; the job removes
-- it when it has computed the person's relationships, unless due_at changed
-- meanwhile. Only the server reads and writes it (no policies).
CREATE TABLE IF NOT EXISTS public.relationship_analysis_due (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  due_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT date_trunc('milliseconds', now())
);

ALTER TABLE public.relationship_analysis_due ENABLE ROW LEVEL SECURITY;

-- Runs as its owner, because the person whose measurement changed cannot write
-- the table. Within one transaction now() does not change, so a batch of
-- measurements updates the row once. Milliseconds, so that the job can compare
-- the time it read (a JavaScript Date) with the row's. Deleting a profile
-- deletes its measurements, and then there is no one to analyze.
CREATE OR REPLACE FUNCTION public.mark_relationship_analysis_due()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  changed_user UUID := CASE WHEN TG_OP = 'DELETE' THEN OLD.user_id ELSE NEW.user_id END;
BEGIN
  INSERT INTO public.relationship_analysis_due (user_id, due_at)
  SELECT changed_user, date_trunc('milliseconds', now())
  WHERE EXISTS (SELECT 1 FROM public.profiles WHERE id = changed_user)
  ON CONFLICT (user_id) DO UPDATE SET due_at = EXCLUDED.due_at
  WHERE relationship_analysis_due.due_at IS DISTINCT FROM EXCLUDED.due_at;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS mark_relationship_analysis_due ON public.measurements;
CREATE TRIGGER mark_relationship_analysis_due
  AFTER INSERT OR UPDATE OR DELETE ON public.measurements
  FOR EACH ROW EXECUTE FUNCTION public.mark_relationship_analysis_due();

-- People who already have measurements.
INSERT INTO public.relationship_analysis_due (user_id)
SELECT DISTINCT user_id FROM public.measurements WHERE deleted_at IS NULL
ON CONFLICT (user_id) DO NOTHING;
