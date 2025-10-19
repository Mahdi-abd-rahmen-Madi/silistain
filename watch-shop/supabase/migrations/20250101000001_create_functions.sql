-- Create a function to get current active drop
CREATE OR REPLACE FUNCTION public.get_active_drop()
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN,
  product_count BIGINT
) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    d.id,
    d.name,
    d.description,
    d.start_date,
    d.end_date,
    d.is_active,
    COUNT(di.id) as product_count
  FROM 
    public.product_drops d
  LEFT JOIN 
    public.product_drop_items di ON d.id = di.drop_id
  WHERE 
    d.is_active = true 
    AND (d.start_date <= NOW() AND (d.end_date IS NULL OR d.end_date >= NOW()))
  GROUP BY 
    d.id, d.name, d.description, d.start_date, d.end_date, d.is_active, d.created_at, d.updated_at
  ORDER BY 
    d.start_date DESC
  LIMIT 1;
$$;

-- Create a function to get products in active drop
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

-- Add comments for documentation
COMMENT ON FUNCTION public.get_active_drop() IS 'Returns the currently active product drop with product count.';
COMMENT ON FUNCTION public.get_products_in_active_drop() IS 'Returns all products in the currently active drop with their positions.';
