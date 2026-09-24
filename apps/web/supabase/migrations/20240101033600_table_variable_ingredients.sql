-- Migration: create_variable_ingredients_table
BEGIN;

-- Create variable_ingredients table
CREATE TABLE public.variable_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_global_variable_id TEXT NOT NULL REFERENCES public.global_variables(id) ON DELETE CASCADE,
    ingredient_global_variable_id TEXT NOT NULL REFERENCES public.global_variables(id) ON DELETE CASCADE,
    quantity_per_serving NUMERIC NULL,
    unit_id TEXT NULL REFERENCES public.units(id) ON DELETE SET NULL,
    is_active_ingredient BOOLEAN DEFAULT FALSE NOT NULL,
    display_order INT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_variable_ingredient UNIQUE (parent_global_variable_id, ingredient_global_variable_id)
);

-- Add indexes for variable_ingredients
CREATE INDEX idx_variable_ingredients_parent_id ON public.variable_ingredients(parent_global_variable_id);
CREATE INDEX idx_variable_ingredients_ingredient_id ON public.variable_ingredients(ingredient_global_variable_id);

-- Add trigger for updated_at timestamp on variable_ingredients
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.variable_ingredients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for variable_ingredients
ALTER TABLE public.variable_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON public.variable_ingredients FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated insert access"
  ON public.variable_ingredients FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Allow updates only by the user who 'owns' the parent variable's global_variable
CREATE POLICY "Allow parent owner update access"
  ON public.variable_ingredients FOR UPDATE
  USING (auth.uid() = (
    SELECT uv.user_id
    FROM public.user_variables uv
    WHERE uv.global_variable_id = variable_ingredients.parent_global_variable_id
  ))
  WITH CHECK (auth.uid() = (
    SELECT uv.user_id
    FROM public.user_variables uv
    WHERE uv.global_variable_id = variable_ingredients.parent_global_variable_id
  ));

-- Allow deletes only by the user who 'owns' the parent variable's global_variable
CREATE POLICY "Allow parent owner delete access"
  ON public.variable_ingredients FOR DELETE
  USING (auth.uid() = (
    SELECT uv.user_id
    FROM public.user_variables uv
    WHERE uv.global_variable_id = variable_ingredients.parent_global_variable_id
  ));

-- Comments (Optional but good practice)
COMMENT ON TABLE public.variable_ingredients IS 'Associates ingredients (which are also global_variables) with a parent variable (food or treatment) identified by a global variable.';
COMMENT ON COLUMN public.variable_ingredients.parent_global_variable_id IS 'The global variable ID of the parent food/treatment variable.';
COMMENT ON COLUMN public.variable_ingredients.ingredient_global_variable_id IS 'The global variable ID of the ingredient.';
COMMENT ON COLUMN public.variable_ingredients.is_active_ingredient IS 'Indicates if this is an active ingredient (primarily for treatments).';
COMMENT ON COLUMN public.variable_ingredients.display_order IS 'Optional order for displaying ingredients.';

COMMIT; 