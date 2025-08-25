import { Order, OrderItem, OrderAddress } from '../types/order';
import { supabase } from '../utils/supabaseClient';

interface CreateOrderData {
  userId?: string | null;  // Make userId optional and nullable
  items: OrderItem[];
  shippingAddress: OrderAddress;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
  subtotal: number;
  shippingCost: number;
  total: number;
  notes?: string;
}

export const createOrder = async (orderData: CreateOrderData): Promise<{ data: Order | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        user_id: orderData.userId || null,
        status: orderData.status,
        payment_status: orderData.paymentStatus,
        subtotal: orderData.subtotal,
        shipping_cost: orderData.shippingCost,
        total: orderData.total,
        shipping_address: orderData.shippingAddress,
        notes: orderData.notes || null,
        items: orderData.items.map(item => ({
          product_id: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          brand: 'brand' in item ? item.brand : undefined
        })),
      }])
      .select('*')
      .single();

    if (error) throw error;
    
    // Transform the response to match our Order type
    const order: Order = {
      id: data.id,
      orderNumber: `ORD-${String(data.id).padStart(6, '0')}`,
      userId: data.user_id,
      items: data.items,
      shippingAddress: data.shipping_address,
      status: data.status,
      paymentStatus: data.payment_status,
      subtotal: data.subtotal,
      shippingCost: data.shipping_cost,
      total: data.total,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };

    return { data: order, error: null };
  } catch (error) {
    console.error('Error creating order:', error);
    return { data: null, error: error as Error };
  }
};
