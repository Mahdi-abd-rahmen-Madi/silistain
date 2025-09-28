-- Add total_amount column to orders table
ALTER TABLE public.orders
ADD COLUMN total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- Add a comment to describe the column
COMMENT ON COLUMN public.orders.total_amount IS 'The total amount of the order after discounts';

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

-- Update existing orders to calculate total_amount if needed
-- This is a placeholder - adjust based on your actual order amount calculation
-- UPDATE public.orders 
-- SET total_amount = COALESCE(subtotal, 0) - COALESCE(discount_amount, 0) - COALESCE(coupon_discount, 0)
-- WHERE total_amount = 0;
