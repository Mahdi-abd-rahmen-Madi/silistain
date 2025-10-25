-- Enable RLS if not already enabled
ALTER TABLE public.hero_media ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view all hero media
CREATE POLICY "Enable read access for all users"
ON public.hero_media
FOR SELECT
TO authenticated, anon
USING (true);

-- Allow authenticated users to insert their own hero media
CREATE POLICY "Enable insert for authenticated users"
ON public.hero_media
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own hero media
CREATE POLICY "Enable update for users based on user_id"
ON public.hero_media
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own hero media
CREATE POLICY "Enable delete for users based on user_id"
ON public.hero_media
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to perform any operation
CREATE POLICY "Enable all for admins"
ON public.hero_media
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins 
    WHERE admins.user_id = auth.uid()
  )
);
