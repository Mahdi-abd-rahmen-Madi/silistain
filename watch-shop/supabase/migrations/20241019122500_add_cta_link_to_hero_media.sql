-- Add cta_link column to hero_media table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'hero_media' 
        AND column_name = 'cta_link'
    ) THEN
        ALTER TABLE public.hero_media 
        ADD COLUMN cta_link TEXT;
        
        COMMENT ON COLUMN public.hero_media.cta_link IS 'The URL that the CTA button should link to';
        
        RAISE NOTICE 'Added cta_link column to hero_media table';
    ELSE
        RAISE NOTICE 'cta_link column already exists in hero_media table';
    END IF;
END $$;
