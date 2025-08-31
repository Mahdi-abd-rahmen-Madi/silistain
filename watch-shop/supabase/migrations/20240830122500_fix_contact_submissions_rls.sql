-- First, disable RLS to modify the table
ALTER TABLE public.contact_submissions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow all operations" ON public.contact_submissions;

-- Re-enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations for anonymous users
CREATE POLICY "Allow all operations for anon"
ON public.contact_submissions
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.contact_submissions TO anon;
