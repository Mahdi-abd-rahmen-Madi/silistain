-- Enable RLS on orders table if not already enabled
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Enable read access for users on their own orders') THEN
    DROP POLICY "Enable read access for users on their own orders" ON public.orders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Enable insert for authenticated users') THEN
    DROP POLICY "Enable insert for authenticated users" ON public.orders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Enable all operations for admins') THEN
    DROP POLICY "Enable all operations for admins" ON public.orders;
  END IF;
END
$$;

-- Allow users to read their own orders
CREATE POLICY "Enable read access for users on their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id OR public.is_admin());

-- Allow authenticated users to create orders
CREATE POLICY "Enable insert for authenticated users"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Allow admins to perform all operations on orders
CREATE POLICY "Enable all operations for admins"
ON public.orders
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Create a function to get the current user's orders
CREATE OR REPLACE FUNCTION public.get_user_orders()
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.orders WHERE user_id = auth.uid() OR public.is_admin();
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_user_orders() TO authenticated;
