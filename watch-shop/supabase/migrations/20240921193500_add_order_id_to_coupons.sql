-- Add order_id column to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES public.orders(id);

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_coupons_order_id ON public.coupons(order_id);
