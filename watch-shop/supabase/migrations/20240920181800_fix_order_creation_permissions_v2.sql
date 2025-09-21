-- 1. Create a secure admin check function that doesn't access auth.users directly
CREATE OR REPLACE FUNCTION public.is_admin_secure()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false);
$$;

-- 2. Make user_id nullable in orders table if not already
ALTER TABLE public.orders 
ALTER COLUMN user_id DROP NOT NULL;

-- 3. Drop existing policies to avoid conflicts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Enable insert for all users') THEN
    DROP POLICY "Enable insert for all users" ON public.orders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Enable read access for users on their own orders') THEN
    DROP POLICY "Enable read access for users on their own orders" ON public.orders;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'Enable all operations for admins') THEN
    DROP POLICY "Enable all operations for admins" ON public.orders;
  END IF;
END
$$;

-- 4. Create new policies
-- Allow anyone to create orders (including guests)
CREATE POLICY "Enable insert for all users"
ON public.orders
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Allow users to read their own orders
CREATE POLICY "Enable read access for users on their own orders"
ON public.orders
FOR SELECT
USING (
  user_id = auth.uid() OR 
  user_id IS NULL OR
  public.is_admin_secure()
);

-- Allow admins full access
CREATE POLICY "Enable all operations for admins"
ON public.orders
USING (public.is_admin_secure())
WITH CHECK (public.is_admin_secure());

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON public.orders TO authenticated, anon;

-- Find the correct sequence name for the orders table's primary key
DO $$
BEGIN
  -- Try to find the sequence name for the orders table's primary key
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'orders' 
    AND column_default LIKE 'nextval(%::regclass)'
    AND column_name = 'id'
  ) THEN
    -- Get the sequence name from the column's default value
    EXECUTE (
      SELECT 'GRANT ALL ON SEQUENCE ' || 
             split_part(
               split_part(column_default, '''', 2),
               '''', 1
             ) || ' TO authenticated, anon;'
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name = 'id'
      AND column_default LIKE 'nextval(%::regclass)'
    );
  END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.is_admin_secure() TO authenticated, anon;

-- 6. Add a comment to document the change
COMMENT ON TABLE public.orders IS 'Orders table with RLS enabled. Guest checkouts are supported with NULL user_id.';

-- 7. Create a function to safely get user orders
CREATE OR REPLACE FUNCTION public.get_user_orders()
RETURNS SETOF public.orders
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM public.orders 
  WHERE user_id = auth.uid() 
  OR user_id IS NULL
  OR public.is_admin_secure();
$$;
