-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated uploads to hero bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to hero bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their uploads" ON storage.objects;

-- Allow all operations on the hero bucket (for development)
CREATE POLICY "Allow all operations on hero bucket"
ON storage.objects
FOR ALL
USING (bucket_id = 'hero');

-- This is a temporary policy for development.
-- In production, you should replace this with more restrictive policies.
-- For example, you might want to limit uploads to authenticated users
-- and only allow public read access.

-- Example of a more secure policy for production:
-- CREATE POLICY "Allow authenticated uploads to hero bucket"
-- ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (bucket_id = 'hero');

-- CREATE POLICY "Allow public read access to hero bucket"
-- ON storage.objects
-- FOR SELECT
-- USING (bucket_id = 'hero');
