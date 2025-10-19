-- Fix the get_products_in_active_drop function with correct column names
CREATE OR REPLACE FUNCTION public.get_products_in_active_drop()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  price NUMERIC(10,2),
  category TEXT,
  brand TEXT,
  image_url TEXT,
  specifications JSONB,
  "position" INTEGER
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    p.id,
    p.name,
    p.description,
    p.price::numeric(10,2) as price,
    p.category,
    p.brand,
    p.image_url,
    p.specifications,
    di."position"
  FROM 
    public.products p
  JOIN 
    public.product_drop_items di ON p.id = di.product_id
  JOIN 
    public.product_drops d ON di.drop_id = d.id
  WHERE 
    d.is_active = true 
    AND (d.start_date <= NOW() AND (d.end_date IS NULL OR d.end_date >= NOW()))
  ORDER BY 
    di."position", p.created_at DESC;
$$;

-- Comment explaining the change
COMMENT ON FUNCTION public.get_products_in_active_drop() IS 'Returns products in the currently active drop with their positions. Updated to use image_url instead of images column.';
