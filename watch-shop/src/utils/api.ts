import { toast } from 'react-hot-toast';
import { CheckoutFormData } from '../types';
import { CartItem } from '../context/CartContext';
import { createOrder } from '../services/orderService';

// Extended interface for items with brand (used in this file only)
interface CartItemWithBrand extends CartItem {
  brand: string;
}

interface ApiResponse {
  success: boolean;
  orderId: string;
  message: string;
  timestamp: string;
  data: any;
}

interface FormattedOrderData {
  'Order Date': string;
  'Order ID': string;
  'Customer Name': string;
  'Email': string;
  'Phone': string;
  'Shipping Address': string;
  'Billing Address': string;
  'Items': string;
  'Subtotal': string;
  'Tax': string;
  'Shipping': string;
  'Total': string;
  'Payment Method': string;
  'Payment Status': string;
  'Order Status': string;
  'Notes'?: string;
  'Timestamp': string;
}

interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image: string;
}

/**
 * Submits order data to Supabase
 * @param {Object} orderData - The order data to submit
 * @returns {Promise<Object>} - The response from the API
 */
export const submitOrderToSheets = async (orderData: FormattedOrderData): Promise<ApiResponse> => {
  try {
    // Calculate totals
    const subtotal = parseFloat(orderData.Subtotal.replace('$', ''));
    const shipping = parseFloat(orderData.Shipping.replace('$', ''));
    const total = parseFloat(orderData.Total.replace('$', ''));
    
    // Parse items from the formatted string (this is a simple example, adjust as needed)
    const items = orderData.Items.split('\n').map(item => {
      const match = item.match(/(\d+)x\s+(.+?)\s+\(?(.+?)\)?\s+-\s+\$(\d+\.\d+)/);
      if (!match) return null;
      
      return {
        productId: '', // You'll need to map this from your products
        name: match[2].trim(),
        brand: match[3]?.trim() || 'Unknown Brand',
        price: parseFloat(match[4]),
        quantity: parseInt(match[1]),
        image: '' // Add image URL if available
      };
    }).filter(Boolean) as OrderItem[];

    // Create order data for Supabase
    const orderDataForSupabase = {
      userId: null, // Null for guest users
      items,
      shippingAddress: {
        firstName: orderData['Customer Name'].split(' ')[0],
        lastName: orderData['Customer Name'].split(' ').slice(1).join(' '),
        email: orderData.Email,
        phone: orderData.Phone,
        address: orderData['Shipping Address'].split('\n')[0],
        city: orderData['Shipping Address'].split('\n')[1]?.split(',')[0]?.trim() || '',
        governorate: '', // Extract from address if needed
        delegation: '',  // Extract from address if needed
        zipCode: orderData['Shipping Address'].match(/\b\d{4}\b/)?.[0] || '',
        postalCode: orderData['Shipping Address'].match(/\b\d{4}\b/)?.[0] || '', // Same as zipCode
        notes: orderData.Notes || ''
      },
      status: 'pending' as const,
      paymentStatus: 'pending' as const,
      subtotal,
      shippingCost: shipping,
      total,
      notes: orderData.Notes
    };

    // Submit to Supabase
    const { data: order, error } = await createOrder(orderDataForSupabase);
    
    if (error) throw error;
    
    return {
      success: true,
      orderId: order?.id || `ORD-${Date.now()}`,
      message: 'Order submitted successfully',
      timestamp: new Date().toISOString(),
      data: orderData
    };
  } catch (error) {
    console.error('Error submitting order:', error);
    toast.error('Failed to submit order. Please try again.');
    throw error;
  }
};

/**
 * Formats order data for submission to Google Sheets
 * @param {Object} order - The order data
 * @param {Array} items - The cart items
 * @returns {Object} - The formatted order data
 */
export const formatOrderData = (order: CheckoutFormData, items: CartItemWithBrand[]): FormattedOrderData => {
  // Format items as a string for the spreadsheet
  const itemsString = items
    .map(item => `${item.quantity}x ${item.name}${'brand' in item ? ` (${item.brand})` : ''} - $${item.price.toFixed(2)} each`)
    .join('\n');
    
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const shipping = 0; // Free shipping
  const total = subtotal + tax; // No shipping cost added
  
  return {
    'Order Date': new Date().toISOString(),
    'Order ID': `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    'Customer Name': `${order.firstName} ${order.lastName}`,
    'Email': order.email,
    'Phone': order.phone,
    'Shipping Address': [
      order.address,
      `${order.city}, ${order.country} ${order.zipCode}`
    ].join('\n'),
    'Billing Address': order.shippingSameAsBilling 
      ? 'Same as shipping address'
      : [
          order.address,
          `${order.city}, ${order.country} ${order.zipCode}`
        ].filter(Boolean).join('\n'),
    'Items': itemsString,
    'Subtotal': `$${subtotal.toFixed(2)}`,
    'Tax': `$${tax.toFixed(2)}`,
    'Shipping': '$0.00', // Free shipping
    'Total': `$${total.toFixed(2)}`,
    'Payment Method': 'Credit Card',
    'Payment Status': 'Paid',
    'Order Status': 'Processing',
    'Notes': typeof order.notes === 'string' ? order.notes : 'No additional notes',
    'Timestamp': new Date().toISOString()
  };
};
