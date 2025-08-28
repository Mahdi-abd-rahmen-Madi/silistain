-- First, ensure the is_admin function exists with the correct definition
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean = true
  );
$$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_media' AND policyname = 'Enable insert for admins') THEN
    DROP POLICY "Enable insert for admins" ON public.hero_media;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_media' AND policyname = 'Enable update for admins') THEN
    DROP POLICY "Enable update for admins" ON public.hero_media;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_media' AND policyname = 'Enable delete for admins') THEN
    DROP POLICY "Enable delete for admins" ON public.hero_media;
  END IF;
END
$$;

-- Recreate read policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hero_media' AND policyname = 'Enable read access for all users') THEN
    CREATE POLICY "Enable read access for all users" 
    ON public.hero_media
    FOR SELECT
    USING (true);
  END IF;
END
$$;

-- Allow admins to insert new hero media
CREATE POLICY "Enable insert for admins"
ON public.hero_media
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Allow admins to update hero media
CREATE POLICY "Enable update for admins"
ON public.hero_media
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Allow admins to delete hero media
CREATE POLICY "Enable delete for admins"
ON public.hero_media
FOR DELETE
TO authenticated
USING (public.is_admin());
