-- Migration: create_global_foods_table
BEGIN;

-- Create global_foods table
CREATE TABLE public.global_foods (
    global_variable_id TEXT PRIMARY KEY REFERENCES public.global_variables(id) ON DELETE CASCADE,
    serving_size_quantity NUMERIC NULL,
    serving_size_unit_id TEXT NULL REFERENCES public.units(id) ON DELETE SET NULL,
    calories_per_serving NUMERIC NULL,
    fat_per_serving NUMERIC NULL,
    protein_per_serving NUMERIC NULL,
    carbs_per_serving NUMERIC NULL,
    -- Add other relevant nutrition fields here if desired (e.g., sugar, sodium)
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add trigger for updated_at timestamp on global_foods
-- Assumes moddatetime function exists from an earlier migration
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.global_foods
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- RLS Policies for global_foods
ALTER TABLE public.global_foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON public.global_foods FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert access"
  ON public.global_foods FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow updates only by the user who 'owns' the related global_variable via user_variables
CREATE POLICY "Allow owner update access"
  ON public.global_foods FOR UPDATE
  USING (auth.uid() = (
    SELECT uv.user_id
    FROM public.user_variables uv
    WHERE uv.global_variable_id = global_foods.global_variable_id
  ))
  WITH CHECK (auth.uid() = (
    SELECT uv.user_id
    FROM public.user_variables uv
    WHERE uv.global_variable_id = global_foods.global_variable_id
  ));

-- Allow deletes only by the user who 'owns' the related global_variable via user_variables
CREATE POLICY "Allow owner delete access"
  ON public.global_foods FOR DELETE
  USING (auth.uid() = (
    SELECT uv.user_id
    FROM public.user_variables uv
    WHERE uv.global_variable_id = global_foods.global_variable_id
  ));

-- Comments (Optional but good practice)
COMMENT ON TABLE public.global_foods IS 'Stores detailed nutritional information for food items linked to a global variable.';
COMMENT ON COLUMN public.global_foods.global_variable_id IS 'Links to the corresponding global_variables entry.';
COMMENT ON COLUMN public.global_foods.serving_size_unit_id IS 'References the unit for the serving size (e.g., grams, ml).';

COMMIT; 