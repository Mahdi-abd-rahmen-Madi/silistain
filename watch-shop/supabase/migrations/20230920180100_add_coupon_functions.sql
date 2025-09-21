-- Function to use a coupon for an order
CREATE OR REPLACE FUNCTION public.use_coupon(
  p_coupon_id UUID,
  p_order_id UUID,
  p_amount DECIMAL(10, 2)
)
RETURNS JSONB AS $$
DECLARE
  v_coupon RECORD;
  v_remaining_amount DECIMAL(10, 2);
  v_discount_applied DECIMAL(10, 2) := 0;
  v_result JSONB;
BEGIN
  -- Start a transaction
  BEGIN
    -- Lock the coupon row to prevent concurrent updates
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE id = p_coupon_id
    FOR UPDATE;
    
    -- Check if coupon exists and is valid
    IF v_coupon IS NULL THEN
      RETURN jsonb_build_object('success', false, 'message', 'Coupon not found');
    END IF;
    
    IF v_coupon.is_used THEN
      RETURN jsonb_build_object('success', false, 'message', 'Coupon has already been used');
    END IF;
    
    IF v_coupon.expires_at < NOW() THEN
      RETURN jsonb_build_object('success', false, 'message', 'Coupon has expired');
    END IF;
    
    IF v_coupon.remaining_amount <= 0 THEN
      RETURN jsonb_build_object('success', false, 'message', 'No remaining balance on this coupon');
    END IF;
    
    -- Calculate how much of the coupon to use
    v_discount_applied := LEAST(v_coupon.remaining_amount, p_amount);
    v_remaining_amount := v_coupon.remaining_amount - v_discount_applied;
    
    -- Update the coupon
    IF v_remaining_amount <= 0 THEN
      -- Mark as fully used
      UPDATE public.coupons
      SET 
        remaining_amount = 0,
        is_used = true,
        used_at = NOW(),
        order_id_used = p_order_id
      WHERE id = p_coupon_id;
    ELSE
      -- Partial use
      UPDATE public.coupons
      SET 
        remaining_amount = v_remaining_amount,
        order_id_used = p_order_id
      WHERE id = p_coupon_id;
    END IF;
    
    -- Update the order with the discount
    UPDATE public.orders
    SET 
      discount_amount = COALESCE(discount_amount, 0) + v_discount_applied,
      total = total - v_discount_applied
    WHERE id = p_order_id;
    
    -- Return success with the discount amount
    RETURN jsonb_build_object(
      'success', true,
      'discount_applied', v_discount_applied,
      'remaining_balance', v_remaining_amount
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback the transaction on error
    RAISE EXCEPTION 'Error applying coupon: %', SQLERRM;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.use_coupon(UUID, UUID, DECIMAL) TO authenticated;
