-- Create measurement conversion function
CREATE OR REPLACE FUNCTION convert_measurement_value(
  p_value NUMERIC,
  p_from_unit_id TEXT,
  p_to_unit_id TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  v_from_factor NUMERIC;
  v_to_factor NUMERIC;
  v_from_category TEXT;
  v_to_category TEXT;
BEGIN
  -- Get conversion factors and categories
  SELECT conversion_factor, category_id 
  INTO v_from_factor, v_from_category
  FROM units 
  WHERE id = p_from_unit_id;

  SELECT conversion_factor, category_id
  INTO v_to_factor, v_to_category
  FROM units
  WHERE id = p_to_unit_id;

  -- Check if units are from the same category
  IF v_from_category != v_to_category THEN
    RAISE EXCEPTION 'Cannot convert between different unit categories';
  END IF;

  -- Convert to base unit then to target unit
  RETURN (p_value * v_from_factor) / v_to_factor;
END;
$$; 