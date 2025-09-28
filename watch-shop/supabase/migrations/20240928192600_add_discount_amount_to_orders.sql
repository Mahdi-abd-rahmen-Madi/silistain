-- Add discount_amount column to orders table
ALTER TABLE public.orders
ADD COLUMN discount_amount NUMERIC(10, 2) DEFAULT 0;

-- Update RLS policies if needed
DO $$
BEGIN
  -- Check if the policy exists
  IF EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'Enable update for authenticated users on their orders'
  ) THEN
    -- Recreate the policy to include the new column if needed
    DROP POLICY IF EXISTS "Enable update for authenticated users on their orders" ON public.orders;
    CREATE POLICY "Enable update for authenticated users on their orders"
      ON public.orders
      FOR UPDATE
      TO authenticated
      USING ((auth.uid() = user_id))
      WITH CHECK ((auth.uid() = user_id));
  END IF;

  -- Check if the policy for service role exists
  IF EXISTS (
    SELECT 1 
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'orders' 
      AND policyname = 'Enable all operations for service role'
  ) THEN
    -- Recreate the service role policy to ensure it has access to the new column
    DROP POLICY IF EXISTS "Enable all operations for service role" ON public.orders;
    CREATE POLICY "Enable all operations for service role"
      ON public.orders
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Update the type if needed to include the new column in the return type of functions
-- This is just an example, adjust according to your actual functions
DO $$
BEGIN
  -- Check if the function exists before trying to update it
  IF EXISTS (
    SELECT 1 
    FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' 
      AND p.proname = 'create_order_in_database'
  ) THEN
    -- You'll need to recreate the function with the updated return type
    -- This is a placeholder - you'll need to adjust the full function definition
    -- based on your actual function in the database
    RAISE NOTICE 'You need to update the create_order_in_database function to handle the discount_amount column';
  END IF;
END $$;
