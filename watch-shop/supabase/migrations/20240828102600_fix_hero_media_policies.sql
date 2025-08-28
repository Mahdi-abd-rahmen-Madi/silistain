-- Fix the JWT access in policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false);
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable insert for admins" ON public.hero_media;
DROP POLICY IF EXISTS "Enable update for admins" ON public.hero_media;

-- Recreate policies with the fixed JWT access
CREATE POLICY "Enable insert for admins"
ON public.hero_media
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Enable update for admins"
ON public.hero_media
FOR UPDATE
TO authenticated
USING (public.is_admin());
