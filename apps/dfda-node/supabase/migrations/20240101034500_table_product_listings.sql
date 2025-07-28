-- migrations/xxxxxxxxxxxxxx_create_product_listings_table.sql

-- Create the product_listings table to link products to sellers
CREATE TABLE public.product_listings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_global_variable_id text NOT NULL REFERENCES public.products(global_variable_id) ON DELETE CASCADE,
    seller_id uuid NOT NULL REFERENCES public.product_sellers(id) ON DELETE CASCADE,
    purchase_url text NULL,
    referral_link text NULL,
    cost numeric(10, 2) NULL CHECK (cost >= 0),
    currency character varying(3) NULL DEFAULT 'USD',
    referral_fee_percentage numeric(5, 2) NULL CHECK (referral_fee_percentage >= 0 AND referral_fee_percentage <= 100),
    is_active boolean DEFAULT true NOT NULL,
    last_checked_at timestamp with time zone NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX idx_product_listings_product_id ON public.product_listings USING btree (product_global_variable_id);
CREATE INDEX idx_product_listings_seller_id ON public.product_listings USING btree (seller_id);
CREATE INDEX idx_product_listings_is_active ON public.product_listings USING btree (is_active);

-- Add constraint for unique product-seller combination (optional, prevents duplicate active listings)
-- ALTER TABLE public.product_listings ADD CONSTRAINT product_listings_product_seller_unique UNIQUE (product_global_variable_id, seller_id);

-- Enable Row Level Security
ALTER TABLE public.product_listings ENABLE ROW LEVEL SECURITY;

-- Grant access to roles (adjust roles as needed)
GRANT SELECT ON TABLE public.product_listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.product_listings TO authenticated; -- Or a specific admin/manager role

-- Policies for RLS
-- Allow public read access
CREATE POLICY "Allow public read access to product listings" ON public.product_listings
    FOR SELECT USING (true);

-- Allow authenticated users (or specific roles) to manage listings
CREATE POLICY "Allow insert for authenticated users" ON public.product_listings
    FOR INSERT TO authenticated WITH CHECK (true); -- Adjust role if needed

CREATE POLICY "Allow update for authenticated users" ON public.product_listings
    FOR UPDATE TO authenticated USING (true); -- Adjust role if needed

CREATE POLICY "Allow delete for authenticated users" ON public.product_listings
    FOR DELETE TO authenticated USING (true); -- Adjust role if needed

-- Trigger to update updated_at timestamp
CREATE TRIGGER set_updated_at -- Renamed trigger for consistency
    BEFORE UPDATE ON public.product_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column(); -- Use standard function 