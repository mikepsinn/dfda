-- A person links a symptom to one of their treatments (a side effect) or to
-- one of their conditions, and rates the symptom as a normal measurement
-- (lib/programs/side-effects.ts). The link says why; the ratings say how bad,
-- over time. A symptom is a catalog variable that global_symptoms marks, so
-- that the same symptom counts across people.

-- Anyone can read which variables are symptoms, as for conditions and treatments.
ALTER TABLE public.global_symptoms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read global symptoms" ON public.global_symptoms;
CREATE POLICY "Anyone can read global symptoms" ON public.global_symptoms
  FOR SELECT TO anon, authenticated
  USING (true);
GRANT SELECT ON public.global_symptoms TO anon, authenticated;

-- The first symptoms: the rating-scale variables of the catalog that are
-- symptoms, not diseases or scores. db/seeds/07_global_symptoms.sql has the
-- same list for a new database.
INSERT INTO public.global_symptoms (id)
SELECT id FROM public.global_variables
WHERE id IN (
  'abdominal-pain', 'chest-pain', 'dizziness', 'dry-cough', 'fatigue', 'headache', 'insomnia',
  'knee-pain', 'low-back-pain', 'muscle-pain', 'nausea', 'pain', 'rash', 'stomach-upset'
)
ON CONFLICT (id) DO NOTHING;

-- A side effect is a symptom from the catalog, not free text. The text and
-- severity columns of the first version stay until a later deployment drops
-- them; new rows leave them empty.
ALTER TABLE public.patient_side_effects
  ADD COLUMN IF NOT EXISTS symptom_id TEXT REFERENCES public.global_symptoms(id) ON DELETE CASCADE;
ALTER TABLE public.patient_side_effects ALTER COLUMN description DROP NOT NULL;
ALTER TABLE public.patient_side_effects
  ADD CONSTRAINT patient_side_effects_treatment_symptom_key UNIQUE (patient_treatment_id, symptom_id);
COMMENT ON COLUMN public.patient_side_effects.symptom_id IS
  'The symptom that the person thinks this treatment causes. Its ratings are measurements of the symptom.';

-- A symptom belongs to one of the person's conditions. One symptom can belong
-- to more than one condition, so the old one-row-per-symptom constraint goes.
ALTER TABLE public.patient_symptoms
  ADD COLUMN IF NOT EXISTS patient_condition_id UUID REFERENCES public.patient_conditions(id) ON DELETE CASCADE;
ALTER TABLE public.patient_symptoms DROP CONSTRAINT IF EXISTS unique_patient_symptom_user_variable;
ALTER TABLE public.patient_symptoms
  ADD CONSTRAINT patient_symptoms_condition_symptom_key UNIQUE (patient_condition_id, symptom_id);
COMMENT ON COLUMN public.patient_symptoms.patient_condition_id IS
  'The condition that the person has this symptom with. Its ratings are measurements of the symptom.';
