-- Create product_drops table
CREATE TABLE IF NOT EXISTS public.product_drops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create product_drop_items junction table
CREATE TABLE IF NOT EXISTS public.product_drop_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_id UUID NOT NULL REFERENCES public.product_drops(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  "position" INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(drop_id, product_id)
);

-- Enable RLS
ALTER TABLE public.product_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_drop_items ENABLE ROW LEVEL SECURITY;

-- Policies for product_drops
CREATE POLICY "Enable read access for all users" 
  ON public.product_drops 
  FOR SELECT 
  USING (true);

CREATE POLICY "Enable all for admins" 
  ON public.product_drops
  FOR ALL 
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
  ));

-- Policies for product_drop_items
CREATE POLICY "Enable read access for all users" 
  ON public.product_drop_items 
  FOR SELECT 
  USING (true);

CREATE POLICY "Enable all for admins" 
  ON public.product_drop_items
  FOR ALL 
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
  ));

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
  price DECIMAL(10, 2),
  category TEXT,
  brand TEXT,
  images TEXT[],
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
    p.images,
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
