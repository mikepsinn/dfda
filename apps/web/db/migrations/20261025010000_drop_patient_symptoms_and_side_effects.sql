-- A person's symptoms and side effects are their symptom reminders and
-- ratings (lib/programs/side-effects.ts): a symptom variable with a reminder
-- that tracks it, and its ratings as normal measurements. A treatment's side
-- effects page shows the symptoms that the person rated since they started the
-- treatment. So these older tables, which no page uses now and which have no
-- rows in production, are not needed.
DROP TABLE IF EXISTS public.patient_side_effects;
DROP TABLE IF EXISTS public.patient_symptoms;
