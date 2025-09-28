-- Add monthly_coupon flag to coupons table
ALTER TABLE public.coupons 
ADD COLUMN IF NOT EXISTS is_monthly_reward BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS month_year VARCHAR(7); -- Format: 'YYYY-MM'

-- Create index for monthly coupons lookup
CREATE INDEX IF NOT EXISTS idx_coupons_monthly ON public.coupons(month_year) 
WHERE is_monthly_reward = true;

-- Function to generate monthly coupons
CREATE OR REPLACE FUNCTION public.generate_monthly_coupons()
RETURNS JSONB AS $$
DECLARE
  current_month_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  existing_coupons INT;
  coupons_to_generate INT;
  i INT;
  new_code TEXT;
  coupon_amount DECIMAL(10, 2) := 10.00; -- Default coupon amount, adjust as needed
  coupon_expiry TIMESTAMP WITH TIME ZONE := (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '2 MONTH' - INTERVAL '1 day')::DATE;
  code_chars TEXT[] := ARRAY['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'];
  code_length INT := 8;
  code_exists BOOLEAN;
  coupon_record RECORD;
  top_customers RECORD;
  coupons_generated INT := 0;
  coupons_assigned INT := 0;
BEGIN
  -- Check how many monthly coupons already exist for this month
  SELECT COUNT(*) INTO existing_coupons 
  FROM public.coupons 
  WHERE is_monthly_reward = true 
  AND month_year = current_month_year;

  -- Calculate how many new coupons to generate (max 50 total per month)
  coupons_to_generate := GREATEST(0, 50 - existing_coupons);
  
  IF coupons_to_generate = 0 THEN
    RETURN jsonb_build_object(
      'status', 'success',
      'message', 'Monthly coupons already generated for ' || current_month_year,
      'coupons_generated', 0,
      'coupons_assigned', 0
    );
  END IF;

  -- Get top customers from previous month (excluding those who already got a coupon this month)
  FOR top_customers IN 
    WITH monthly_spend AS (
      SELECT 
        o.user_id,
        u.email,
        SUM(o.total_amount) as total_spent,
        COUNT(o.id) as order_count
      FROM public.orders o
      JOIN auth.users u ON o.user_id = u.id
      WHERE o.created_at >= DATE_TRUNC('MONTH', CURRENT_DATE - INTERVAL '1 month')
        AND o.created_at < DATE_TRUNC('MONTH', CURRENT_DATE)
        AND o.status = 'completed'
        AND o.user_id NOT IN (
          SELECT user_id 
          FROM public.coupons 
          WHERE is_monthly_reward = true 
          AND month_year = current_month_year
          AND user_id IS NOT NULL
        )
      GROUP BY o.user_id, u.email
      ORDER BY total_spent DESC
      LIMIT coupons_to_generate
    )
    SELECT user_id, email, total_spent, order_count
    FROM monthly_spend
  LOOP
    -- Generate a unique coupon code
    LOOP
      new_code := '';
      FOR i IN 1..code_length LOOP
        new_code := new_code || code_chars[1 + floor(random() * array_length(code_chars, 1))];
      END LOOP;
      
      -- Check if code already exists
      SELECT EXISTS (SELECT 1 FROM public.coupons WHERE code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;

    -- Create the coupon
    INSERT INTO public.coupons (
      code,
      user_id,
      amount,
      remaining_amount,
      expires_at,
      is_monthly_reward,
      month_year,
      created_at
    ) VALUES (
      new_code,
      top_customers.user_id,
      coupon_amount,
      coupon_amount,
      coupon_expiry,
      true,
      current_month_year,
      NOW()
    )
    RETURNING * INTO coupon_record;

    coupons_generated := coupons_generated + 1;
    coupons_assigned := coupons_assigned + 1;
  END LOOP;

  -- If we still have coupons to generate (not enough top spenders), create unassigned coupons
  FOR i IN 1..(coupons_to_generate - coupons_assigned) LOOP
    -- Generate a unique coupon code
    LOOP
      new_code := '';
      FOR i IN 1..code_length LOOP
        new_code := new_code || code_chars[1 + floor(random() * array_length(code_chars, 1))];
      END LOOP;
      
      -- Check if code already exists
      SELECT EXISTS (SELECT 1 FROM public.coupons WHERE code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;

    -- Create unassigned coupon
    INSERT INTO public.coupons (
      code,
      amount,
      remaining_amount,
      expires_at,
      is_monthly_reward,
      month_year,
      created_at
    ) VALUES (
      new_code,
      coupon_amount,
      coupon_amount,
      coupon_expiry,
      true,
      current_month_year,
      NOW()
    );

    coupons_generated := coupons_generated + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Generated ' || coupons_generated || ' monthly coupons for ' || current_month_year,
    'coupons_generated', coupons_generated,
    'coupons_assigned', coupons_assigned
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM,
    'coupons_generated', coupons_generated,
    'coupons_assigned', coupons_assigned
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to assign a monthly coupon to a specific user
CREATE OR REPLACE FUNCTION public.assign_monthly_coupon(
  p_user_id UUID,
  p_amount DECIMAL(10, 2) DEFAULT 10.00,
  p_expiry_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  current_month_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  new_code TEXT;
  code_chars TEXT[] := ARRAY['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'];
  code_length INT := 8;
  code_exists BOOLEAN;
  coupon_record RECORD;
  user_email TEXT;
  expiry_date TIMESTAMP WITH TIME ZONE;
  existing_coupons INT;
  max_coupons_per_month INT := 50;
  current_coupons INT;
BEGIN
  -- Check if user already received a monthly coupon this month
  SELECT COUNT(*) INTO existing_coupons 
  FROM public.coupons 
  WHERE is_monthly_reward = true 
  AND month_year = current_month_year
  AND user_id = p_user_id;
  
  IF existing_coupons > 0 THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'User already received a monthly coupon for ' || current_month_year
    );
  END IF;
  
  -- Check if we've reached the monthly limit
  SELECT COUNT(*) INTO current_coupons
  FROM public.coupons 
  WHERE is_monthly_reward = true 
  AND month_year = current_month_year;
  
  IF current_coupons >= max_coupons_per_month THEN
    RETURN jsonb_build_object(
      'status', 'error',
      'message', 'Monthly coupon limit of ' || max_coupons_per_month || ' has been reached for ' || current_month_year
    );
  END IF;
  
  -- Get user email for the coupon
  SELECT email INTO user_email FROM auth.users WHERE id = p_user_id;
  
  -- Calculate expiry date
  expiry_date := NOW() + (p_expiry_days || ' days')::INTERVAL;
  
  -- Generate a unique coupon code
  LOOP
    new_code := '';
    FOR i IN 1..code_length LOOP
      new_code := new_code || code_chars[1 + floor(random() * array_length(code_chars, 1))];
    END LOOP;
    
    -- Check if code already exists
    SELECT EXISTS (SELECT 1 FROM public.coupons WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;

  -- Create the coupon
  INSERT INTO public.coupons (
    code,
    user_id,
    amount,
    remaining_amount,
    expires_at,
    is_monthly_reward,
    month_year,
    created_at
  ) VALUES (
    new_code,
    p_user_id,
    p_amount,
    p_amount,
    expiry_date,
    true,
    current_month_year,
    NOW()
  )
  RETURNING * INTO coupon_record;

  -- Send notification to user (you'll need to implement this function)
  -- PERFORM public.send_notification(
  --   p_user_id,
  --   'New Monthly Coupon!',
  --   'You have received a monthly coupon of $' || p_amount || '. Code: ' || new_code || ' (Expires: ' || TO_CHAR(expiry_date, 'YYYY-MM-DD') || ')'
  -- );

  RETURN jsonb_build_object(
    'status', 'success',
    'message', 'Monthly coupon assigned to user',
    'coupon_code', new_code,
    'amount', p_amount,
    'expires_at', expiry_date
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'status', 'error',
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get available monthly coupons for a user
CREATE OR REPLACE FUNCTION public.get_user_monthly_coupons(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  code TEXT,
  amount DECIMAL(10, 2),
  remaining_amount DECIMAL(10, 2),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_used BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.code,
    c.amount,
    c.remaining_amount,
    c.expires_at,
    c.is_used,
    c.created_at
  FROM public.coupons c
  WHERE c.user_id = p_user_id
    AND c.is_monthly_reward = true
    AND c.is_used = false
    AND (c.expires_at IS NULL OR c.expires_at > NOW())
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Create a cron job to run at the start of each month
-- This needs to be set up in the Supabase dashboard or via SQL:
-- SELECT cron.schedule(
--   'generate-monthly-coupons',
--   '0 0 1 * *',  -- At 00:00 on day-of-month 1
--   $$SELECT public.generate_monthly_coupons()$$
-- );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_monthly_coupons() TO service_role;
GRANT EXECUTE ON FUNCTION public.assign_monthly_coupon(UUID, DECIMAL, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_monthly_coupons(UUID) TO authenticated;

-- Update RLS policies to allow users to see their monthly coupons
CREATE POLICY "Users can view their monthly coupons" 
ON public.coupons 
FOR SELECT 
USING (auth.uid() = user_id AND is_monthly_reward = true);

-- Allow service role to insert monthly coupons
CREATE POLICY "Service role can insert monthly coupons"
ON public.coupons
FOR INSERT
TO service_role
WITH CHECK (true);
