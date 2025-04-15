-- migrations/xxxxxxxxxxxxxx_create_products_table.sql

-- Create the products table (generalized)
CREATE TYPE public.product_type_enum AS ENUM (
    'trackable_item',
    'lab_test',
    'wearable_device',
    'service',
    'other'
);

CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Optional link to a trackable global variable
    global_variable_id text NULL REFERENCES public.global_variables(id) ON DELETE SET NULL,
    product_type public.product_type_enum NOT NULL,
    name text NOT NULL, -- General product name (might override linked global_variable name in some contexts)
    description text NULL,
    brand_name text NULL,
    manufacturer text NULL,
    upc text NULL,
    -- Add other generic product fields here if needed
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Constraint: Ensure global_variable_id is set ONLY for 'trackable_item' type
    -- (or null otherwise) - basic check, more complex logic might be needed
    CONSTRAINT chk_product_global_variable_link CHECK (
        (product_type = 'trackable_item' AND global_variable_id IS NOT NULL) OR
        (product_type != 'trackable_item' AND global_variable_id IS NULL)
    ),
    -- Constraint: If linked, maybe ensure the product name matches the global variable name? (Optional)
    -- CONSTRAINT chk_product_name_matches_global_variable CHECK (...),
    CONSTRAINT products_global_variable_id_unique UNIQUE (global_variable_id) -- Ensure 1:1 link if set
);

-- Add indexes
CREATE INDEX idx_products_product_type ON public.products USING btree (product_type);
CREATE INDEX idx_products_global_variable_id ON public.products USING btree (global_variable_id) WHERE global_variable_id IS NOT NULL;
CREATE INDEX idx_products_brand_name ON public.products USING btree (brand_name);
CREATE INDEX idx_products_upc ON public.products USING btree (upc);

-- Add unique constraint on UPC if desired (uncomment if needed)
-- ALTER TABLE public.products ADD CONSTRAINT products_upc_unique UNIQUE (upc);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Grant access to roles (adjust roles as needed)
-- Assuming anon and authenticated roles need read access
GRANT SELECT ON TABLE public.products TO anon, authenticated;
-- Assuming authenticated users (or specific roles like admin) can manage products
GRANT INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated; -- Adjust role if needed

-- Policies for RLS
-- Allow public read access
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);

-- Allow authenticated users (or specific roles) to manage products
CREATE POLICY "Allow insert for authenticated users" ON public.products
    FOR INSERT TO authenticated WITH CHECK (true); -- Adjust role if needed

CREATE POLICY "Allow update for authenticated users" ON public.products
    FOR UPDATE TO authenticated USING (true); -- Adjust role if needed

CREATE POLICY "Allow delete for authenticated users" ON public.products
    FOR DELETE TO authenticated USING (true); -- Adjust role if needed

-- Trigger to update updated_at timestamp
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime (updated_at); 