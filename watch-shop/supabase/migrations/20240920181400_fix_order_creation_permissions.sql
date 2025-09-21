-- Fix permissions for order creation
-- This migration ensures the database user has proper access to the users table
-- when creating orders

-- 1. Create a function to check if a user exists (without requiring direct access to the users table)
CREATE OR REPLACE FUNCTION public.user_exists(user_id_to_check UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function returns true if the user exists, false otherwise
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE id = user_id_to_check
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Grant necessary permissions to the authenticated role
GRANT EXECUTE ON FUNCTION public.user_exists(UUID) TO authenticated;

-- 3. Update the orders table to handle NULL user_id properly
ALTER TABLE public.orders 
ALTER COLUMN user_id DROP NOT NULL;

-- 4. Update the insert policy to handle both authenticated and unauthenticated users
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.orders;

CREATE POLICY "Enable insert for authenticated users"
ON public.orders
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow insert if:
  -- 1. user_id is NULL (guest checkout), or
  -- 2. user_id matches the authenticated user's ID and the user exists, or
  -- 3. the user is an admin
  user_id IS NULL 
  OR (user_id = auth.uid() AND public.user_exists(auth.uid()))
  OR public.is_admin()
);

-- 5. Add a comment to document the change
COMMENT ON POLICY "Enable insert for authenticated users" ON public.orders IS 
'Allows authenticated users to create orders. Guest checkouts (NULL user_id) are allowed. 
Users can only create orders for themselves unless they are admins.';
