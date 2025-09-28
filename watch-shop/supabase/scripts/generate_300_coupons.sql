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

-- Main script to generate 300 coupons with different values
DO $$
DECLARE
  coupon_count INTEGER;
  new_code TEXT;
  i INTEGER;
  coupon_amounts INTEGER[] := ARRAY[10, 20, 30];
  amount INTEGER;
  coupon_type TEXT;
  coupon_name TEXT;
  coupon_description TEXT;
  coupon_expiry DATE := (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '2 MONTH' - INTERVAL '1 day')::DATE;
  month_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  coupons_generated INTEGER := 0;
  coupons_per_type INTEGER := 100;
  total_coupons INTEGER := 300;
BEGIN
  -- Check if we already have these coupons for the current month
  SELECT COUNT(*) INTO coupon_count
  FROM public.coupons 
  WHERE is_monthly_reward = true 
  AND month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  IF coupon_count >= total_coupons THEN
    RAISE NOTICE 'Monthly coupons for % already exist. Found % coupons.', month_year, coupon_count;
    RETURN;
  END IF;
  
  RAISE NOTICE 'Starting to generate % monthly coupons for %...', total_coupons, month_year;
  
  -- Generate coupons for each amount type
  FOREACH amount IN ARRAY coupon_amounts LOOP
    CASE amount
      WHEN 10 THEN 
        coupon_type := 'silver';
        coupon_name := '10 DT Coupon';
        coupon_description := '10 DT discount on your next purchase';
      WHEN 20 THEN 
        coupon_type := 'gold';
        coupon_name := '20 DT Coupon';
        coupon_description := '20 DT discount on your next purchase';
      WHEN 30 THEN 
        coupon_type := 'platinum';
        coupon_name := '30 DT Coupon';
        coupon_description := '30 DT discount on your next purchase';
    END CASE;
    
    RAISE NOTICE 'Generating % % DT coupons...', coupons_per_type, amount;
    
    FOR i IN 1..coupons_per_type LOOP
      new_code := generate_coupon_code();
      
      -- Insert the coupon
      INSERT INTO public.coupons (
        code,
        amount,
        remaining_amount,
        expires_at,
        is_used,
        is_monthly_reward,
        month_year,
        coupon_type,
        name,
        description,
        created_at
      ) VALUES (
        new_code,
        amount::DECIMAL(10, 2),
        amount::DECIMAL(10, 2),
        coupon_expiry,
        false,
        true,
        month_year,
        coupon_type,
        coupon_name,
        coupon_description,
        NOW()
      );
      
      coupons_generated := coupons_generated + 1;
      
      -- Output progress
      IF i % 10 = 0 THEN
        RAISE NOTICE 'Generated % % DT coupons', i, amount;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed generating % % DT coupons', coupons_per_type, amount;
  END LOOP;
  
  RAISE NOTICE 'Successfully generated % monthly coupons for %', coupons_generated, month_year;
  
  -- Verify the counts
  SELECT COUNT(*) INTO coupon_count
  FROM public.coupons 
  WHERE is_monthly_reward = true 
  AND month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  
  -- Breakdown by amount
  RAISE NOTICE 'Coupon generation summary:';
  RAISE NOTICE '----------------------------';
  
  FOR amount IN SELECT DISTINCT amount::INTEGER FROM public.coupons 
                WHERE is_monthly_reward = true 
                AND month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM') 
                ORDER BY amount LOOP
    
    SELECT COUNT(*) INTO coupon_count
    FROM public.coupons 
    WHERE is_monthly_reward = true 
    AND month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
    AND amount = amount::DECIMAL(10, 2);
    
    RAISE NOTICE '% DT coupons: %', amount, coupon_count;
  END LOOP;
  
  RAISE NOTICE '----------------------------';
  RAISE NOTICE 'Total coupons generated: %', coupons_generated;
  
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Error generating coupons: %', SQLERRM;
END;
$$;
