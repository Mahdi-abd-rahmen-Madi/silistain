-- Remove city column from orders table
ALTER TABLE public.orders 
DROP COLUMN IF EXISTS city;
