-- Remove 'Ingredient' category insertion as it's decided not to use a separate category
-- INSERT INTO public.variable_categories (id, name, short_description)
-- VALUES ('ingredient', 'Ingredient', 'A substance used as a component in food or treatments.')
-- ON CONFLICT (id) DO NOTHING;

-- Create food_details table
CREATE TABLE public.food_details (
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

-- Add trigger for updated_at timestamp on food_details
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.food_details
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- RLS Policies for food_details
ALTER TABLE public.food_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.food_details FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert access" ON public.food_details FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow owner update access" ON public.food_details FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.user_variables uv WHERE uv.global_variable_id = food_details.global_variable_id)) WITH CHECK (auth.uid() = (SELECT user_id FROM public.user_variables uv WHERE uv.global_variable_id = food_details.global_variable_id));
CREATE POLICY "Allow owner delete access" ON public.food_details FOR DELETE USING (auth.uid() = (SELECT user_id FROM public.user_variables uv WHERE uv.global_variable_id = food_details.global_variable_id));

-- Create item_ingredients table
CREATE TABLE public.item_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_global_variable_id TEXT NOT NULL REFERENCES public.global_variables(id) ON DELETE CASCADE,
    ingredient_global_variable_id TEXT NOT NULL REFERENCES public.global_variables(id) ON DELETE CASCADE,
    quantity_per_serving NUMERIC NULL,
    unit_id TEXT NULL REFERENCES public.units(id) ON DELETE SET NULL,
    is_active_ingredient BOOLEAN DEFAULT FALSE NOT NULL,
    display_order INT NULL, -- Renamed from 'order' to avoid keyword conflict
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_item_ingredient UNIQUE (item_global_variable_id, ingredient_global_variable_id)
);

-- Add indexes for item_ingredients
CREATE INDEX idx_item_ingredients_item_id ON public.item_ingredients(item_global_variable_id);
CREATE INDEX idx_item_ingredients_ingredient_id ON public.item_ingredients(ingredient_global_variable_id);

-- Add trigger for updated_at timestamp on item_ingredients
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.item_ingredients
FOR EACH ROW
EXECUTE FUNCTION moddatetime('updated_at');

-- RLS Policies for item_ingredients
ALTER TABLE public.item_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access" ON public.item_ingredients FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert access" ON public.item_ingredients FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow parent owner update access" ON public.item_ingredients FOR UPDATE
  USING (auth.uid() = (SELECT user_id FROM public.user_variables uv WHERE uv.global_variable_id = item_ingredients.item_global_variable_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.user_variables uv WHERE uv.global_variable_id = item_ingredients.item_global_variable_id));
CREATE POLICY "Allow parent owner delete access" ON public.item_ingredients FOR DELETE
  USING (auth.uid() = (SELECT user_id FROM public.user_variables uv WHERE uv.global_variable_id = item_ingredients.item_global_variable_id));
