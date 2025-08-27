-- Add columns for multiple images (up to 5)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url_1 TEXT,
ADD COLUMN IF NOT EXISTS image_url_2 TEXT,
ADD COLUMN IF NOT EXISTS image_url_3 TEXT,
ADD COLUMN IF NOT EXISTS image_url_4 TEXT,
ADD COLUMN IF NOT EXISTS image_url_5 TEXT;

-- Create a function to get all images as an array
CREATE OR REPLACE FUNCTION get_product_images(p_product_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    images TEXT[];
BEGIN
    SELECT ARRAY_REMOVE(ARRAY[
        image_url_1,
        image_url_2,
        image_url_3,
        image_url_4,
        image_url_5
    ]::TEXT[], NULL)
    INTO images
    FROM products
    WHERE id = p_product_id;
    
    RETURN images;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
