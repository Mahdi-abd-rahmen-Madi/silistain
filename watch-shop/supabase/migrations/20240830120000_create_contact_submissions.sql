-- Create contact_submissions table
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

-- First, disable RLS temporarily to avoid permission issues
ALTER TABLE public.contact_submissions DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert" ON public.contact_submissions;

-- Re-enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations (for testing)
CREATE POLICY "Allow all operations"
ON public.contact_submissions
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.contact_submissions TO anon, authenticated;

-- Create index for better querying
CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at 
ON public.contact_submissions(created_at);
