import { createClient } from '@supabase/supabase-js';

type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export default async function handler(req: { method: string; body: Json }) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );

    const { orderTotal, email, userId } = req.body as { 
      orderTotal: number; 
      email: string; 
      userId?: string 
    };

    if (!orderTotal || !email) {
      return new Response(
        JSON.stringify({ error: 'orderTotal and email are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate coupon code
    const generateCouponCode = (length = 8): string => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    // Calculate coupon value based on order total
    const calculateCouponValue = (total: number): number => {
      if (total >= 500) return 30;  // 30 TND for orders 500 TND and above
      if (total >= 300) return 20;  // 20 TND for orders between 300-499 TND
      if (total >= 120) return 10;  // 10 TND for orders between 120-299 TND
      return 0;                    // No coupon for orders below 120 TND
    };

    const couponValue = calculateCouponValue(orderTotal);
    
    if (couponValue === 0) {
      return new Response(
        JSON.stringify({ error: 'No coupon available for this order total' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const couponData = {
      code: generateCouponCode(),
      amount: couponValue,
      remaining_amount: couponValue,
      user_email: email,
      user_id: userId || null,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      is_used: false,
    };

    const { data, error } = await supabaseClient
      .from('coupons')
      .insert(couponData)
      .select()
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({ coupon: data }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating coupon:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
