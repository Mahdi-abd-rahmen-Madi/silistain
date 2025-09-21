-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(5) UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  remaining_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  order_id_used UUID REFERENCES public.orders(id) ON DELETE SET NULL
);

-- Add index for faster lookups
CREATE INDEX idx_coupons_user_id ON public.coupons(user_id);
CREATE INDEX idx_coupons_code ON public.coupons(code);

-- Enable RLS and set policies
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their own coupons
CREATE POLICY "Users can view their own coupons" 
ON public.coupons 
FOR SELECT 
USING (auth.uid() = user_id);

-- Policy to allow admins full access
CREATE POLICY "Admins have full access to coupons" 
ON public.coupons
USING (EXISTS (
  SELECT 1 FROM auth.users
  WHERE auth.uid() = id AND (raw_user_meta_data->>'is_admin')::boolean = true
));

-- Function to generate a random 5-digit coupon code
CREATE OR REPLACE FUNCTION public.generate_coupon_code()
RETURNS VARCHAR(5) AS $$
DECLARE
  code VARCHAR(5);
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 5-digit number and pad with leading zeros if needed
    code := LPAD(FLOOR(random() * 100000)::TEXT, 5, '0');
    
    -- Check if code already exists
    SELECT EXISTS (SELECT 1 FROM public.coupons WHERE code = code) INTO code_exists;
    
    -- If code doesn't exist, exit the loop
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a coupon for a user after order completion
CREATE OR REPLACE FUNCTION public.create_coupon_after_order()
RETURNS TRIGGER AS $$
DECLARE
  coupon_amount DECIMAL(10, 2);
  coupon_code VARCHAR(5);
  user_id UUID;
  order_total DECIMAL(10, 2);
BEGIN
  -- Only proceed for completed orders
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;
  
  -- Get the user ID and order total
  user_id := NEW.user_id;
  order_total := NEW.total;
  
  -- Determine coupon amount based on order total
  IF order_total >= 300 THEN
    coupon_amount := 30.00;
  ELSIF order_total >= 150 AND order_total < 300 THEN
    coupon_amount := 20.00;
  ELSIF order_total >= 100 AND order_total < 150 THEN
    coupon_amount := 10.00;
  ELSIF order_total >= 70 AND order_total < 100 THEN
    coupon_amount := 5.00;
  ELSE
    -- No coupon for orders less than 70 TND
    RETURN NEW;
  END IF;
  
  -- Generate a unique coupon code
  SELECT public.generate_coupon_code() INTO coupon_code;
  
  -- Insert the new coupon
  INSERT INTO public.coupons (
    code, 
    user_id, 
    amount, 
    remaining_amount, 
    expires_at
  ) VALUES (
    coupon_code,
    user_id,
    coupon_amount,
    coupon_amount,
    (NOW() + INTERVAL '3 months')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create coupons after order completion
DROP TRIGGER IF EXISTS after_order_completed ON public.orders;
CREATE TRIGGER after_order_completed
AFTER UPDATE OF status ON public.orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.create_coupon_after_order();
