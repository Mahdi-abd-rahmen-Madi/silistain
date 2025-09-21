import { supabase } from '../../lib/supabaseClient';

export const generateAndSaveCoupon = async (orderTotal: number, email: string, userId?: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-coupon', {
      body: { orderTotal, email, userId },
    });

    if (error) throw error;
    return data.coupon;
  } catch (error) {
    console.error('Error generating coupon:', error);
    throw error;
  }
};

export const getAvailableCoupons = async (userId: string) => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('user_id', userId)
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const markCouponAsUsed = async (couponId: string, orderId: string) => {
  const { error } = await supabase
    .from('coupons')
    .update({ 
      is_used: true,
      order_id_used: orderId,
      used_at: new Date().toISOString()
    })
    .eq('id', couponId);

  if (error) throw error;
  return true;
};
