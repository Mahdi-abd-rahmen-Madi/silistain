-- Add coupon_discount column to orders table
ALTER TABLE public.orders
ADD COLUMN coupon_discount NUMERIC(10, 2) DEFAULT 0;

-- Add a comment to describe the column
COMMENT ON COLUMN public.orders.coupon_discount IS 'The discount amount from the applied coupon';

-- Also add coupon_id column which is referenced in the code
ALTER TABLE public.orders
ADD COLUMN coupon_id UUID REFERENCES public.coupons(id);

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
    -- Recreate the service role policy to ensure it has access to the new columns
    DROP POLICY IF EXISTS "Enable all operations for service role" ON public.orders;
    CREATE POLICY "Enable all operations for service role"
      ON public.orders
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
