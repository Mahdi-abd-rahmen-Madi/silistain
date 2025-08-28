-- Create a storage policy to allow authenticated users to upload files to the hero bucket
CREATE POLICY "Allow authenticated uploads to hero bucket"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'hero' AND
  (auth.role() = 'authenticated')
);

-- Allow public read access to the hero bucket
CREATE POLICY "Allow public read access to hero bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'hero');

-- Allow authenticated users to update their own uploads
CREATE POLICY "Allow users to update their uploads"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'hero' AND
  auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own uploads
CREATE POLICY "Allow users to delete their uploads"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'hero' AND
  auth.role() = 'authenticated'
);
