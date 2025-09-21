-- Create or replace the orders view to use the secure function
CREATE OR REPLACE VIEW public.orders_with_user_email AS
SELECT 
  o.*,
  public.get_user_email(o.user_id) as user_email
FROM public.orders o;

-- Update RLS policies to use the secure functions
DROP POLICY IF EXISTS "Enable read access for users on their own orders" ON public.orders;

CREATE POLICY "Enable read access for users on their own orders"
ON public.orders
FOR SELECT
USING (
  user_id = auth.uid() OR 
  user_id IS NULL OR
  public.is_admin()
);

-- Grant select on the view to authenticated users
GRANT SELECT ON public.orders_with_user_email TO authenticated;
