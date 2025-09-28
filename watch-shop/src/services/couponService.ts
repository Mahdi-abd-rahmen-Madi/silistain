import { supabase } from '../lib/supabaseClient';

// Generate a random coupon code
export const generateCouponCode = (length = 8): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Calculate coupon value based on order total
export const calculateCouponValue = (orderTotal: number): number => {
  if (orderTotal >= 500) return 30;  // 30 TND for orders 500 TND and above
  if (orderTotal >= 300) return 20;  // 20 TND for orders between 300-499 TND
  if (orderTotal >= 120) return 10;  // 10 TND for orders between 120-299 TND
  return 0;                          // No coupon for orders below 120 TND
};

export interface Coupon {
  id: string;
  code: string;
  user_id: string;
  amount: number;
  remaining_amount: number;
  created_at: string;
  expires_at: string;
  is_used: boolean;
  used_at: string | null;
  order_id_used: string | null;
}

export const getAvailableCoupons = async (userId: string): Promise<Coupon[]> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('user_id', userId)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coupons:', error);
    throw error;
  }

  return data || [];
};

export const validateCoupon = async (code: string, userId: string): Promise<{ valid: boolean; coupon?: Coupon; error?: string }> => {
  try {
    const trimmedCode = code.trim().toUpperCase();
    console.log('Validating coupon:', { code, trimmedCode, userId });
    
    // First try with direct query
    const { data: couponData, error: queryError } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', trimmedCode)
      .single();
      
    console.log('Direct query result:', { couponData, queryError });
    
    // If direct query fails, try with RPC
    if (queryError) {
      console.log('Direct query failed, trying RPC...');
      const { data, error: rpcError } = await supabase.rpc('validate_coupon', {
        p_code: trimmedCode,
        p_user_id: userId
      });
      
      console.log('RPC result:', { data, rpcError });
      
      if (rpcError || !data?.valid) {
        throw new Error(rpcError?.message || 'Invalid coupon code');
      }
      
      return {
        valid: true,
        coupon: data.coupon
      };
    }
    
    // Validate coupon data from direct query
    if (!couponData) {
      throw new Error('Coupon not found');
    }
    
    if (couponData.is_used) {
      return {
        valid: false,
        error: 'This coupon has already been used.'
      };
    }

    if (new Date(couponData.expires_at) < new Date()) {
      return {
        valid: false,
        error: 'This coupon has expired.'
      };
    }

    if (couponData.remaining_amount <= 0) {
      return {
        valid: false,
        error: 'No remaining balance on this coupon.'
      };
    }

    return {
      valid: true,
      coupon: couponData as Coupon
    };

  } catch (error) {
    console.error('Error validating coupon:', error);
    return {
      valid: false,
      error: 'An error occurred while validating the coupon.'
    };
  }
};

export const applyCoupon = async (couponId: string, orderId: string, amountToUse: number): Promise<{ success: boolean; error?: string; data?: any }> => {
  try {
    // Ensure amount is properly formatted as a decimal with 2 decimal places
    const formattedAmount = parseFloat(amountToUse.toFixed(2));
    
    const { data, error } = await supabase.rpc('use_coupon', {
      p_coupon_id: couponId,
      p_order_id: orderId,
      p_amount: formattedAmount
    });

    if (error) {
      console.error('Error applying coupon:', error);
      return {
        success: false,
        error: error.message
      };
    }

    // If data is not an object, it means the function didn't return the expected JSONB
    if (data === null || typeof data !== 'object') {
      return {
        success: false,
        error: 'Invalid response from coupon service'
      };
    }

    // Return the data from the database function
    return {
      success: data.success === true,
      error: data.message,
      data: data
    };
  } catch (err) {
    console.error('Unexpected error in applyCoupon:', err);
    return {
      success: false,
      error: 'An unexpected error occurred while applying the coupon'
    };
  }
};

// Get coupon history for a user
export const getCouponHistory = async (userId: string): Promise<Coupon[]> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coupon history:', error);
    throw error;
  }

  return data || [];
};
