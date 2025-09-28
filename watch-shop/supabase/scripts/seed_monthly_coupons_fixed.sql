-- First, drop the function if it exists to avoid return type conflicts
DO $$
BEGIN
  DROP FUNCTION IF EXISTS generate_coupon_code();
  RAISE NOTICE 'Dropped existing generate_coupon_code function';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error dropping function: %', SQLERRM;
END $$;

-- Create the function with the correct return type
CREATE OR REPLACE FUNCTION generate_coupon_code() 
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  code_chars TEXT[] := ARRAY['A','B','C','D','E','F','G','H','J','K','L','M','N','P','Q','R','S','T','U','V','W','X','Y','Z','2','3','4','5','6','7','8','9'];
  code_length INTEGER := 8;
  code_exists BOOLEAN;
  i INTEGER;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..code_length LOOP
      code := code || code_chars[1 + floor(random() * array_length(code_chars, 1))];
    END LOOP;
    
    -- Check if code already exists
    SELECT NOT EXISTS (SELECT 1 FROM public.coupons WHERE code = code) INTO code_exists;
    EXIT WHEN code_exists;
  END LOOP;
  
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Main script to generate monthly coupons
DO $$
DECLARE
  coupon_count INTEGER;
  new_code TEXT;
  code_length INTEGER := 8;
  code_exists BOOLEAN;
  i INTEGER;
  j INTEGER;
  coupons_to_generate INTEGER;
  assigned_count INTEGER := 0;
  unassigned_count INTEGER := 0;
  total_coupons INTEGER := 0;
  assigned_id UUID;
  customer_record RECORD;
  customer_cursor CURSOR FOR
    SELECT 
      o.user_id,
      u.email,
      SUM(o.total_amount) as total_spent
    FROM public.orders o
    JOIN auth.users u ON o.user_id = u.id
    WHERE o.created_at >= DATE_TRUNC('MONTH', CURRENT_DATE - INTERVAL '1 month')
      AND o.created_at < DATE_TRUNC('MONTH', CURRENT_DATE)
      AND o.status = 'completed'
    GROUP BY o.user_id, u.email
    ORDER BY total_spent DESC
    LIMIT 20;
BEGIN
  -- Check if we already have monthly coupons for October 2024
  SELECT COUNT(*) INTO coupon_count
  FROM public.coupons 
  WHERE is_monthly_reward = true 
  AND month_year = '2024-10';
  
  IF coupon_count > 0 THEN
    RAISE NOTICE 'Monthly coupons for October 2024 already exist. Found % coupons.', coupon_count;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Starting to generate monthly coupons for October 2024...';
  
  -- First, assign to top 20 spenders from the past month (if any)
  OPEN customer_cursor;
  LOOP
    FETCH customer_cursor INTO customer_record;
    EXIT WHEN NOT FOUND;
    
    -- Generate a unique code for each customer
    new_code := generate_coupon_code();
    
    -- Insert the coupon for this customer
    INSERT INTO public.coupons (
      code,
      user_id,
      amount,
      remaining_amount,
      expires_at,
      is_used,
      is_monthly_reward,
      month_year,
      created_at
    ) VALUES (
      new_code,
      customer_record.user_id,
      10.00,  -- $10 coupon amount
      10.00,
      (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '2 MONTH' - INTERVAL '1 day')::DATE,  -- End of next month
      false,
      true,
      '2024-10',
      NOW()
    )
    RETURNING id INTO assigned_id;
    
    assigned_count := assigned_count + 1;
    RAISE NOTICE 'Generated coupon % for user %', new_code, customer_record.email;
  END LOOP;
  CLOSE customer_cursor;
  
  RAISE NOTICE 'Generated % assigned coupons', assigned_count;
  
  -- Calculate how many more coupons we need to reach 50
  SELECT GREATEST(0, 50 - COUNT(*)) 
  INTO coupons_to_generate
  FROM public.coupons 
  WHERE is_monthly_reward = true 
  AND month_year = '2024-10';
  
  RAISE NOTICE 'Generating % more unassigned coupons', coupons_to_generate;
  
  -- Generate the remaining coupons
  FOR i IN 1..coupons_to_generate LOOP
    new_code := generate_coupon_code();
    
    -- Insert the new coupon
    INSERT INTO public.coupons (
      code,
      amount,
      remaining_amount,
      expires_at,
      is_used,
      is_monthly_reward,
      month_year,
      created_at
    ) VALUES (
      new_code,
      10.00,  -- $10 coupon amount
      10.00,
      (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '2 MONTH' - INTERVAL '1 day')::DATE,  -- End of next month
      false,
      true,
      '2024-10',
      NOW()
    );
    
    unassigned_count := unassigned_count + 1;
  END LOOP;
  
  -- Get final counts
  SELECT COUNT(*) INTO total_coupons
  FROM public.coupons 
  WHERE is_monthly_reward = true 
  AND month_year = '2024-10';
  
  -- Output results
  RAISE NOTICE 'Monthly coupons generation complete';
  RAISE NOTICE 'Total coupons created: %', total_coupons;
  RAISE NOTICE 'Assigned coupons: %', assigned_count;
  RAISE NOTICE 'Unassigned coupons: %', unassigned_count;
  
  -- Return the results as a JSON object
  RAISE NOTICE '{"total_coupons_created": %, "assigned_coupons": %, "unassigned_coupons": %}',
    total_coupons, assigned_count, unassigned_count;
    
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error generating coupons: %', SQLERRM;
END $$;
