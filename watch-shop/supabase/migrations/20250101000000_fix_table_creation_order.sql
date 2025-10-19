-- Drop the function first if it exists
DROP FUNCTION IF EXISTS public.get_products_in_active_drop();

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

-- Create policies for product_drops
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

-- Create policies for product_drop_items
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
