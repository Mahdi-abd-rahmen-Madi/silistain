-- Add missing columns to hero_media table
ALTER TABLE public.hero_media 
ADD COLUMN IF NOT EXISTS cta_link TEXT,
ADD COLUMN IF NOT EXISTS cta_text TEXT,
ADD COLUMN IF NOT EXISTS subtitle TEXT,
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Update existing rows with default values if needed
UPDATE public.hero_media SET 
  cta_link = '/shop',
  cta_text = 'Shop Now',
  subtitle = '',
  thumbnail_url = ''
WHERE cta_link IS NULL;
