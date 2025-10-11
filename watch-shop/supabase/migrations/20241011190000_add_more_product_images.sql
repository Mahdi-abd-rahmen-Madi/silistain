-- Add 5 more image columns (total 10)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS image_url_6 TEXT,
ADD COLUMN IF NOT EXISTS image_url_7 TEXT,
ADD COLUMN IF NOT EXISTS image_url_8 TEXT,
ADD COLUMN IF NOT EXISTS image_url_9 TEXT,
ADD COLUMN IF NOT EXISTS image_url_10 TEXT;

-- Update the function to include all 10 images
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
        image_url_5,
        image_url_6,
        image_url_7,
        image_url_8,
        image_url_9,
        image_url_10
    ]::TEXT[], NULL)
    INTO images
    FROM products
    WHERE id = p_product_id;
    
    RETURN images;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
