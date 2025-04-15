-- migrations/xxxxxxxxxxxxxx_create_product_sellers_table.sql

-- Create the product_sellers table
CREATE TABLE public.product_sellers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    website_url text NULL,
    default_referral_fee_percentage numeric(5, 2) NULL DEFAULT 0.00 CHECK (default_referral_fee_percentage >= 0 AND default_referral_fee_percentage <= 100),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX idx_product_sellers_name ON public.product_sellers USING btree (name);

-- Add constraint for name uniqueness
ALTER TABLE public.product_sellers ADD CONSTRAINT product_sellers_name_unique UNIQUE (name);

-- Enable Row Level Security
ALTER TABLE public.product_sellers ENABLE ROW LEVEL SECURITY;

-- Grant access to roles (adjust roles as needed)
GRANT SELECT ON TABLE public.product_sellers TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.product_sellers TO authenticated; -- Or a specific admin/manager role

-- Policies for RLS
-- Allow public read access
CREATE POLICY "Allow public read access to product sellers" ON public.product_sellers
    FOR SELECT USING (true);

-- Allow authenticated users (or specific roles) to manage sellers
CREATE POLICY "Allow insert for authenticated users" ON public.product_sellers
    FOR INSERT TO authenticated WITH CHECK (true); -- Adjust role if needed

CREATE POLICY "Allow update for authenticated users" ON public.product_sellers
    FOR UPDATE TO authenticated USING (true); -- Adjust role if needed

CREATE POLICY "Allow delete for authenticated users" ON public.product_sellers
    FOR DELETE TO authenticated USING (true); -- Adjust role if needed

-- Trigger to update updated_at timestamp
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.product_sellers
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime (updated_at); 