-- Create hero_media table
CREATE TABLE IF NOT EXISTS public.hero_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    title TEXT,
    subtitle TEXT,
    cta_text TEXT,
    cta_link TEXT,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin check function
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT coalesce((auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean, false);
$$;

-- Enable RLS
ALTER TABLE public.hero_media ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable read access for all users" 
ON public.hero_media
FOR SELECT
USING (true);

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

-- Create a trigger to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hero_media_updated_at
BEFORE UPDATE ON public.hero_media
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to ensure only one active hero media at a time
CREATE OR REPLACE FUNCTION ensure_single_active_hero_media()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.hero_media
    SET is_active = false
    WHERE id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_single_active_hero_media
AFTER INSERT OR UPDATE ON public.hero_media
FOR EACH ROW
WHEN (NEW.is_active = true)
EXECUTE FUNCTION ensure_single_active_hero_media();
