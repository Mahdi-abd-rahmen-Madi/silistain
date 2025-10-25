-- Drop the trigger and function first to avoid dependency issues
DROP TRIGGER IF EXISTS trigger_single_active_hero_media ON public.hero_media;
DROP FUNCTION IF EXISTS public.ensure_single_active_hero_media();

-- Drop the trigger for updated_at
DROP TRIGGER IF EXISTS update_hero_media_updated_at ON public.hero_media;

-- Drop the table
DROP TABLE IF EXISTS public.hero_media;
