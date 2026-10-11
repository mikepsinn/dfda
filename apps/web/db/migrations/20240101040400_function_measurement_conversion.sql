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
  v_from_offset NUMERIC;
  v_from_category TEXT;
  v_to_factor NUMERIC;
  v_to_offset NUMERIC;
  v_to_category TEXT;
  v_base_value NUMERIC;
BEGIN
  -- Handle same unit conversion
  IF p_from_unit_id = p_to_unit_id THEN
    RETURN p_value;
  END IF;

  -- Get 'from' unit details
  SELECT conversion_factor, conversion_offset, unit_category_id
  INTO v_from_factor, v_from_offset, v_from_category
  FROM units
  WHERE id = p_from_unit_id;

  -- Get 'to' unit details
  SELECT conversion_factor, conversion_offset, unit_category_id
  INTO v_to_factor, v_to_offset, v_to_category
  FROM units
  WHERE id = p_to_unit_id;

  -- Check for valid units
  IF v_from_factor IS NULL THEN
    RAISE EXCEPTION 'Invalid source unit ID provided: %', p_from_unit_id;
  END IF;
  IF v_to_factor IS NULL THEN
      RAISE EXCEPTION 'Invalid target unit ID provided: %', p_to_unit_id;
  END IF;

  -- Check if units are from the same category
  IF v_from_category != v_to_category THEN
    RAISE EXCEPTION 'Cannot convert between different unit categories: % and %', v_from_category, v_to_category;
  END IF;

  -- Protect against division by zero (should not happen with valid factors)
  IF v_from_factor = 0 THEN
      RAISE EXCEPTION 'Conversion factor for source unit % cannot be zero.', p_from_unit_id;
  END IF;

  -- Convert 'from' value to base unit value
  -- Formula: V_base = (V_from - O_from) / F_from
  v_base_value := (p_value - v_from_offset) / v_from_factor;

  -- Convert base unit value to 'to' value
  -- Formula: V_to = (V_base * F_to) + O_to
  RETURN (v_base_value * v_to_factor) + v_to_offset;

END;
$$;