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
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('user_id', userId)
    .eq('is_used', false)
    .gt('remaining_amount', 0)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    return {
      valid: false,
      error: error?.message || 'Invalid or expired coupon code.'
    };
  }

  return {
    valid: true,
    coupon: data as Coupon
  };
};

export const applyCoupon = async (couponId: string, orderId: string, amountToUse: number): Promise<{ success: boolean; error?: string }> => {
  const { data, error } = await supabase.rpc('use_coupon', {
    p_coupon_id: couponId,
    p_order_id: orderId,
    p_amount: amountToUse
  });

  if (error) {
    console.error('Error applying coupon:', error);
    return {
      success: false,
      error: error.message
    };
  }

  return { success: true };
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
