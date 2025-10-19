-- Remove subtitle column from hero_media table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'hero_media' 
        AND column_name = 'subtitle'
    ) THEN
        ALTER TABLE public.hero_media 
        DROP COLUMN subtitle;
        
        RAISE NOTICE 'Removed subtitle column from hero_media table';
    ELSE
        RAISE NOTICE 'subtitle column does not exist in hero_media table';
    END IF;
END $$;
