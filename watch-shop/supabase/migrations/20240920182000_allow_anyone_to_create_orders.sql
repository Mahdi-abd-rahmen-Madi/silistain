-- 1. First, make user_id nullable if it's not already
ALTER TABLE public.orders 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Drop existing policies to avoid conflicts
DO $$
BEGIN
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
  DROP POLICY IF EXISTS "Enable read access for users on their own orders" ON public.orders;
  DROP POLICY IF EXISTS "Enable all operations for admins" ON public.orders;
END $$;

-- 3. Create a simple insert policy that allows anyone to create orders
CREATE POLICY "Enable insert for all users"
ON public.orders
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- 4. Create a read policy that allows users to see their own orders
CREATE POLICY "Enable read access for users on their own orders"
ON public.orders
FOR SELECT
USING (
  user_id = auth.uid() OR 
  user_id IS NULL
);

-- 5. Create an admin policy for full access
CREATE POLICY "Enable all operations for admins"
ON public.orders
USING (EXISTS (
  SELECT 1 FROM auth.users
  WHERE id = auth.uid() 
  AND raw_user_meta_data->>'is_admin' = 'true'
));

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.orders TO authenticated, anon;

-- 7. Create a function to safely generate an order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 'ORD-' || to_char(CURRENT_DATE, 'YYYYMMDD-') || 
         lpad((COUNT(*) + 1)::text, 6, '0')
  FROM public.orders
  WHERE created_at::date = CURRENT_DATE;
$$;

-- 8. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO authenticated, anon;
