-- Add brand column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS brand TEXT;

-- Update existing rows to have a default brand if needed
UPDATE public.products 
SET brand = 'Unknown' 
WHERE brand IS NULL;

-- Create an index on the brand column for better query performance
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products (brand);

-- Update RLS policies to include the brand column
-- (This assumes you want the same access rules for the brand as other product data)
-- No need to modify existing policies as they already cover all columns
