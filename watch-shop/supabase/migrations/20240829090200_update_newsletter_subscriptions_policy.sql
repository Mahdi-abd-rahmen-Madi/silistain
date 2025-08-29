-- Drop all existing policies on this table
DROP POLICY IF EXISTS "Enable insert for all users" ON public.newsletter_subscriptions;

-- Create a policy that allows all operations (temporary for debugging)
CREATE POLICY "Allow all operations on newsletter_subscriptions"
ON public.newsletter_subscriptions
FOR ALL
USING (true)
WITH CHECK (true);
