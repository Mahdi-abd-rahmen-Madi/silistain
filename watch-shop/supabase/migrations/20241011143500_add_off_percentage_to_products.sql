-- Add off_percentage column to products table
ALTER TABLE public.products
ADD COLUMN off_percentage DECIMAL(5, 2) DEFAULT 0;

-- Update RLS policies to include the new column
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the update policy to ensure it includes the new column
DROP POLICY IF EXISTS "Enable update for admins only" ON public.products;

CREATE POLICY "Enable update for admins only" 
  ON public.products 
  FOR UPDATE 
  USING (auth.role() = 'authenticated' AND auth.uid() IN (
    SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
  ));
