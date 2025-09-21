-- Update the code column to support longer coupon codes
ALTER TABLE public.coupons 
ALTER COLUMN code TYPE VARCHAR(20);
