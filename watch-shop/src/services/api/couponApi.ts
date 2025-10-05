import { supabase } from '../../lib/supabaseClient';
import { Coupon } from '../couponService';
import logger from '../../utils/logger';

export interface CouponData {
  code: string;
  value: number;
  expiryDate: Date;
  email: string;
  orderId: string;
  isUsed: boolean;
  userId?: string | null;
}

export const saveCoupon = async (couponData: CouponData): Promise<Coupon> => {
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code: couponData.code,
      amount: couponData.value,
      remaining_amount: couponData.value,
      expires_at: couponData.expiryDate.toISOString(),
      user_email: couponData.email,
      user_id: couponData.userId || null,
      order_id: couponData.orderId,
      is_used: couponData.isUsed,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    logger.error('Error saving coupon:', error);
    throw error;
  }

  return data as unknown as Coupon;
};

export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  const { data, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    logger.error('Error fetching coupon:', error);
    return null;
  }

  return data as unknown as Coupon;
};

export const markCouponAsUsed = async (code: string, orderId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('coupons')
    .update({
      is_used: true,
      order_id_used: orderId,
      used_at: new Date().toISOString(),
    })
    .eq('code', code);

  if (error) {
    logger.error('Error marking coupon as used:', error);
    return false;
  }

  return true;
};
