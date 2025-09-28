-- Update all monthly coupons to expire 3 months from now
UPDATE public.coupons 
SET expires_at = (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '4 MONTH' - INTERVAL '1 day')::DATE + INTERVAL '23 hours 59 minutes'
WHERE is_monthly_reward = true 
AND month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
AND expires_at = (DATE_TRUNC('MONTH', CURRENT_DATE) + INTERVAL '2 MONTH' - INTERVAL '1 day')::DATE + INTERVAL '23 hours 59 minutes';

-- Verify the update
SELECT 
  amount,
  COUNT(*) as count,
  MIN(expires_at) as new_expiry_date,
  MIN(code) as example_code
FROM public.coupons 
WHERE is_monthly_reward = true 
AND month_year = TO_CHAR(CURRENT_DATE, 'YYYY-MM')
GROUP BY amount
ORDER BY amount;
