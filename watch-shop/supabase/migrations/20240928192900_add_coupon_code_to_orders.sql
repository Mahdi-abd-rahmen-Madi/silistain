-- Add coupon_code column to orders table
ALTER TABLE public.orders
ADD COLUMN coupon_code TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.orders.coupon_code IS 'The coupon code applied to this order, if any';

-- Update the existing discount_amount column to be nullable
ALTER TABLE public.orders 
ALTER COLUMN discount_amount DROP NOT NULL,
ALTER COLUMN discount_amount DROP DEFAULT;

-- Update RLS policies if needed
DO $$
BEGIN
  -- Check if the policy exists for service role
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
