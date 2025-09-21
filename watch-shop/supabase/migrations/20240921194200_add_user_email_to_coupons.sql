-- Add user_email column to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_coupons_user_email ON public.coupons(user_email);
