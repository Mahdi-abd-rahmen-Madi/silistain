-- Allow user_id to be NULL in the orders table
ALTER TABLE public.orders 
  ALTER COLUMN user_id DROP NOT NULL;

-- Update the RLS policy to allow orders without a user_id
DROP POLICY IF EXISTS "Enable insert for all users" ON public.orders;

CREATE POLICY "Enable insert for all users"
ON public.orders
FOR INSERT
TO authenticated, anon
WITH CHECK (true);

-- Update the select policy to allow viewing orders without a user_id
DROP POLICY IF EXISTS "Enable read access for users on their own orders" ON public.orders;

CREATE POLICY "Enable read access for users on their own orders"
ON public.orders
FOR SELECT
USING (
  user_id IS NULL OR 
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = auth.uid() 
    AND (raw_user_meta_data->>'is_admin')::boolean = true
  )
);
