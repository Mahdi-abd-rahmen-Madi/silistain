-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for admin users" ON public.contact_submissions;
DROP POLICY IF EXISTS "Enable delete for admin users" ON public.contact_submissions;
DROP POLICY IF EXISTS "Enable update for admin users" ON public.contact_submissions;

-- Create policies that allow admin users to manage contact submissions
CREATE POLICY "Enable all for admin users"
ON public.contact_submissions
FOR ALL
USING (auth.role() = 'service_role' OR auth.uid() IN (
  SELECT id FROM auth.users WHERE raw_user_meta_data->>'is_admin' = 'true'
));

-- Also allow anon to insert (for the contact form)
CREATE POLICY "Allow anon to insert"
ON public.contact_submissions
FOR INSERT
TO anon
WITH CHECK (true);
