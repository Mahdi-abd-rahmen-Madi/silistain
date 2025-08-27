-- Add specifications column as JSONB type to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}'::jsonb;

-- Update existing rows to have an empty JSON object as default
UPDATE products 
SET specifications = '{}'::jsonb 
WHERE specifications IS NULL;
