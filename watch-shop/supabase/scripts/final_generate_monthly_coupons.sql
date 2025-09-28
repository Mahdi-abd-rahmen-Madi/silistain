-- Final Monthly Coupon Generation Script
-- This script will generate 50 monthly coupons (assigned to top spenders first, then unassigned)

-- 1. Ensure the function exists with the correct definition
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

-- 2. Main script to generate coupons
DO $$
DECLARE
  current_month_year TEXT := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
  existing_coupons INTEGER;
  coupons_needed INTEGER;
  new_code TEXT;
  i INTEGER;
  
  -- Cursor for top spenders from last month who don't have a coupon yet
  top_spenders CURSOR FOR
    WITH monthly_spenders AS (
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
      LIMIT 20
    )
    SELECT * FROM monthly_spenders ms
    WHERE NOT EXISTS (
      SELECT 1 FROM public.coupons c 
      WHERE c.user_id = ms.user_id 
      AND c.month_year = current_month_year
      AND c.is_monthly_reward = true
    );
    
  spender RECORD;
  coupons_created INTEGER := 0;
  assigned_count INTEGER := 0;
  unassigned_count INTEGER := 0;
  
BEGIN
  -- Check how many monthly coupons already exist for this month
  SELECT COUNT(*) INTO existing_coupons
  FROM public.coupons 
  WHERE is_monthly_reward = true 
  AND month_year = current_month_year;
  
  RAISE NOTICE 'Found % existing monthly coupons for %', existing_coupons, current_month_year;
  
  -- If we already have 50 or more coupons, exit
  IF existing_coupons >= 50 THEN
    RAISE NOTICE 'Already have enough monthly coupons (%)', existing_coupons;
    RETURN;
  END IF;
  
  -- Calculate how many more we need
  coupons_needed := 50 - existing_coupons;
  RAISE NOTICE 'Need to generate % more monthly coupons', coupons_needed;
  
  -- First, assign coupons to top spenders who don't already have one
  FOR spender IN top_spenders LOOP
    -- Generate a new coupon code
    new_code := generate_coupon_code();
    
    -- Insert the coupon
    INSERT INTO public.coupons (
      code,
      user_id,
      user_email,
      amount,
      remaining_amount,
      expires_at,
      is_used,
      is_monthly_reward,
      month_year
    ) VALUES (
      new_code,
      spender.user_id,
      spender.email,
      10.00,  -- $10 coupon
      10.00,
      (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '2 MONTH' - INTERVAL '1 day')::DATE,
      false,
      true,
      current_month_year
    );
    
    assigned_count := assigned_count + 1;
    coupons_created := coupons_created + 1;
    RAISE NOTICE 'Created coupon % for user % (spent % last month)', 
      new_code, spender.email, spender.total_spent;
    
    -- If we've created all needed coupons, exit
    EXIT WHEN coupons_created >= coupons_needed;
  END LOOP;
  
  -- If we still need more coupons, create unassigned ones
  WHILE coupons_created < coupons_needed LOOP
    new_code := generate_coupon_code();
    
    -- Get a default user ID (could be system user or any valid user ID)
    DECLARE
      default_user_id UUID;
    BEGIN
      -- Try to get the first admin user or any valid user
      SELECT id INTO default_user_id 
      FROM auth.users 
      ORDER BY created_at 
      LIMIT 1;
      
      -- If no users exist, we need to handle this case
      IF default_user_id IS NULL THEN
        RAISE EXCEPTION 'No users found in the system. Cannot create unassigned coupons.';
      END IF;
      
      -- Insert the unassigned coupon
      INSERT INTO public.coupons (
        code,
        user_id,
        amount,
        remaining_amount,
        expires_at,
        is_used,
        is_monthly_reward,
        month_year
      ) VALUES (
        new_code,
        default_user_id,
        10.00,  -- $10 coupon
        10.00,
        (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '2 MONTH' - INTERVAL '1 day')::DATE,
        false,
        true,
        current_month_year
      );
      
      unassigned_count := unassigned_count + 1;
      coupons_created := coupons_created + 1;
      RAISE NOTICE 'Created unassigned coupon %', new_code;
      
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Error creating unassigned coupon: %', SQLERRM;
      -- If we can't create unassigned coupons, we'll exit the loop
      EXIT;
    END;
  END LOOP;
  
  -- Show summary
  RAISE NOTICE 'Monthly coupon generation complete for %', current_month_year;
  RAISE NOTICE 'Total coupons created: %', coupons_created;
  RAISE NOTICE 'Assigned to top spenders: %', assigned_count;
  RAISE NOTICE 'Unassigned coupons: %', unassigned_count;
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error generating monthly coupons: %', SQLERRM;
END $$;
