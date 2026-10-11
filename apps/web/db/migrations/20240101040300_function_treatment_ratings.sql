-- Create treatment rating functions
CREATE OR REPLACE FUNCTION get_average_treatment_rating(p_treatment_id UUID, p_condition_id UUID)
RETURNS TABLE (
  avg_effectiveness NUMERIC,
  avg_side_effects NUMERIC,
  total_ratings INT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(effectiveness)::numeric, 2) as avg_effectiveness,
    ROUND(AVG(side_effects)::numeric, 2) as avg_side_effects,
    COUNT(*)::int as total_ratings
  FROM treatment_ratings
  WHERE treatment_id = p_treatment_id
    AND condition_id = p_condition_id
    AND deleted_at IS NULL;
END;
$$;

CREATE OR REPLACE FUNCTION increment_helpful_count(p_rating_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE treatment_ratings
  SET helpful_count = helpful_count + 1
  WHERE id = p_rating_id;
END;
$$; 