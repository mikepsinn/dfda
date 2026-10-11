-- Apply the updated_at trigger specifically to treatment_ratings
-- This ensures it runs after the treatment_ratings table is created.

CREATE TRIGGER update_treatment_ratings_updated_at
    BEFORE UPDATE ON public.treatment_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column(); 