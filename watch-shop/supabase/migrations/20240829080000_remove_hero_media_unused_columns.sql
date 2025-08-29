-- Remove unused columns from hero_media table
ALTER TABLE hero_media
  DROP COLUMN IF EXISTS title,
  DROP COLUMN IF EXISTS subtitle,
  DROP COLUMN IF EXISTS cta_text,
  DROP COLUMN IF EXISTS cta_link,
  DROP COLUMN IF EXISTS is_active;
