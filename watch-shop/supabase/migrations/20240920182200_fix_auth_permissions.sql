-- 1. Grant necessary permissions on the auth schema
GRANT USAGE ON SCHEMA auth TO authenticated, anon;

-- 2. Drop the function if it exists to avoid conflicts
DROP FUNCTION IF EXISTS public.user_exists(uuid);

-- 3. Create a secure function to check if a user exists without direct table access
CREATE OR REPLACE FUNCTION public.check_user_exists(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = check_user_id
  );
$$;

-- 4. Update the orders insert policy to be more permissive
DO $$
BEGIN
  -- Drop existing insert policy if it exists
  DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;
  
  -- Create a new insert policy that doesn't check auth.users
  CREATE POLICY "Enable insert for all users"
  ON public.orders
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);
  
  -- Update the select policy to be more permissive
  DROP POLICY IF EXISTS "Enable read access for users on their own orders" ON public.orders;
  
  CREATE POLICY "Enable read access for users on their own orders"
  ON public.orders
  FOR SELECT
  USING (
    user_id = auth.uid() OR 
    user_id IS NULL OR
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND (raw_user_meta_data->>'is_admin')::boolean = true
    )
  );
END $$;

-- 5. Grant execute on the check_user_exists function
GRANT EXECUTE ON FUNCTION public.check_user_exists(uuid) TO authenticated, anon;

-- 5. Create a function to set default order values
CREATE OR REPLACE FUNCTION public.set_order_defaults()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Set default values if not provided
  NEW.status := COALESCE(NEW.status, 'pending');
  NEW.created_at := COALESCE(NEW.created_at, NOW());
  NEW.updated_at := NOW();
  
  -- Generate an order number if not provided
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'ORD-' || to_char(NOW(), 'YYYYMMDD-') || 
                       lpad((SELECT COUNT(*)::text 
                           FROM public.orders 
                           WHERE created_at::date = NOW()::date), 6, '0');
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Create a trigger to set defaults before insert
DO $$
BEGIN
  -- Drop existing trigger if it exists
  DROP TRIGGER IF EXISTS set_order_defaults_trigger ON public.orders;
  
  -- Create the trigger
  CREATE TRIGGER set_order_defaults_trigger
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_order_defaults();
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors if the trigger already exists
  RAISE NOTICE 'Could not create trigger: %', SQLERRM;
END $$;
