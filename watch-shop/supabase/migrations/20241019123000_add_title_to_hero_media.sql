-- Add title column to hero_media table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'hero_media' 
        AND column_name = 'title'
    ) THEN
        ALTER TABLE public.hero_media 
        ADD COLUMN title TEXT;
        
        COMMENT ON COLUMN public.hero_media.title IS 'The title or heading for the hero media';
        
        RAISE NOTICE 'Added title column to hero_media table';
    ELSE
        RAISE NOTICE 'title column already exists in hero_media table';
    END IF;
END $$;
