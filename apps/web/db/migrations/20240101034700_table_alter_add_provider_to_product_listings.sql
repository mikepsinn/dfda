-- migrations/xxxxxxxxxxxxxx_add_provider_to_product_listings.sql

-- Add provider_id column to link listings (especially services) to a specific provider
ALTER TABLE public.product_listings
ADD COLUMN provider_id uuid NULL REFERENCES public.providers(id) ON DELETE SET NULL;

-- Add an index for faster lookups based on the provider
CREATE INDEX idx_product_listings_provider_id ON public.product_listings(provider_id);

-- Optional: Add a constraint to enforce provider_id for services
-- This is more complex as it requires checking the related product's type.
-- Might be better handled in application logic or via a trigger.
-- ALTER TABLE public.product_listings
-- ADD CONSTRAINT chk_service_listing_has_provider
-- CHECK (
--     CASE
--         WHEN EXISTS (
--             SELECT 1 FROM public.products p
--             WHERE p.id = product_listings.product_id AND p.product_type = 'service'
--         )
--         THEN provider_id IS NOT NULL
--         ELSE true -- Allow null provider_id for non-service products
--     END
-- ); 