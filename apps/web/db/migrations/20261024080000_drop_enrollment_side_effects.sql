-- Side effects are no longer stored per program enrollment. A member tracks a
-- symptom with a normal reminder for it, and its ratings are their normal
-- measurements (lib/programs/side-effects.ts). So this table, which only listed
-- the symptoms of each enrollment, is not needed.
DROP TABLE IF EXISTS public.enrollment_side_effects;
