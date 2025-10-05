import { supabase } from '../lib/supabaseClient';
import { CheckoutFormData } from '../types/checkout';
import { CartItem } from '../types/cart';
import { Order, OrderItem, OrderAddress } from '../types/order';
import logger from '../utils/logger';

/**
 * Creates a new order in the database with proper user association
 * @param formData - Checkout form data
 * @param cartItems - Items in the shopping cart
 * @param userId - Current user's ID (can be null for guests)
 * @returns Promise resolving to the created order
 */
export const createOrderInDatabase = async (
  formData: CheckoutFormData, 
  cartItems: CartItem[], 
  userId: string | null
): Promise<Order> => {
  try {
    // Calculate total directly without intermediate steps
    const total = cartItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    
    // Format items for storage
    const formattedItems: OrderItem[] = cartItems.map(item => ({
      productId: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image || ''
    }));
    
    // Handle user ID safely (convert empty string to null)
    const safeUserId = userId && userId.trim() !== '' ? userId : null;

    // Create order record with minimal required fields
    const orderData = {
      user_id: safeUserId,
      status: 'pending',
      total: total,
      items: formattedItems,
      shipping_address: {
        name: formData.name,
        email: formData.email || '',
        phone: formData.phone,
        address: formData.address,
        city: formData.delegation,
        governorate: formData.governorate,
        delegation: formData.delegation
      },
      order_number: `ORD-${Date.now()}`,
    };

    logger.debug('Creating order with data:', orderData);
    
    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();
      
    if (error) {
      logger.error('Supabase error creating order:', error);
      throw new Error(`Failed to save order: ${error.message}`);
    }
    
    if (!data) {
      throw new Error('Order created but no data returned');
    }
    
    // Convert to Order type with ALL required properties
    return {
      id: data.id,
      orderNumber: data.order_number || `ORD-${Date.now()}`,
      userId: data.user_id,
      items: data.items,
      shippingAddress: data.shipping_address,
      status: data.status,
      paymentStatus: 'pending', // REQUIRED by Order interface
      subtotal: total,         // REQUIRED by Order interface (same as total)
      shippingCost: 0,         // REQUIRED by Order interface (no shipping cost)
      total: total,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  } catch (err) {
    logger.error('Error creating order in database:', err);
    throw err;
  }
};