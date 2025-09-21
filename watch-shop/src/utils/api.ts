import { toast } from 'react-hot-toast';
import { CheckoutFormData } from '../types/checkout';
import { OrderItem, OrderAddress } from '../types/order';
import { CartItem } from '../types/cart'; 
import { createOrderInDatabase } from '../services/orderService';
import { formatPrice } from '../lib/utils';

interface ApiResponse {
  success: boolean;
  orderId: string;
  message: string;
  timestamp: string;
  data?: any;
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
  'Total': string;
  'Order Status': string;
  'Timestamp': string;
}

export const submitOrderToSheets = async (
  orderData: FormattedOrderData, 
  t: (key: string) => string = (key) => key,
  userId: string | null = null // ADDED userId parameter
): Promise<ApiResponse> => {
  try {
    // Parse items from the formatted string
    const items = orderData.Items.split('\n').map(item => {
      // Match format like "1x Product Name - 123.45 TND each"
      const match = item.match(/(\d+)x\s+(.+?)\s+-\s+([\d,.]+)\s+TND/);
      if (!match) return null;
      
      // Remove commas and convert to float
      const price = parseFloat(match[3].replace(/,/g, ''));
      
      return {
        id: '',
        productId: '',
        name: match[2].trim(),
        price: price,
        quantity: parseInt(match[1]),
        image: ''
      } as CartItem;
    }).filter(Boolean) as CartItem[];

    // Extract customer name parts
    const customerNameParts = orderData['Customer Name'].split(' ');
    const firstName = customerNameParts[0];
    const lastName = customerNameParts.slice(1).join(' ') || '';

    // Parse shipping address
    const addressLines = orderData['Shipping Address'].split('\n');
    const addressLine1 = addressLines[0] || '';
    const addressLine2 = addressLines[1] || '';
    
    // Extract governorate and delegation from addressLine2
    let governorate = '';
    let delegation = '';
    if (addressLine2) {
      const addressParts = addressLine2.split(',');
      if (addressParts.length > 0) {
        delegation = addressParts[0].trim();
      }
      if (addressParts.length > 1) {
        governorate = addressParts[1].trim();
      }
    }

    // Create shipping address (without notes)
    const shippingAddress: OrderAddress = {
      firstName,
      lastName,
      email: orderData.Email,
      phone: orderData.Phone,
      address: addressLine1,
      city: delegation,
      governorate,
      delegation,
      postalCode: orderData['Shipping Address'].match(/\b\d{4}\b/)?.[0] || '',
      notes: ''
    };

    // Create order data for database (without notes)
    const orderForDatabase: CheckoutFormData = {
      firstName,
      lastName,
      email: orderData.Email,
      phone: orderData.Phone,
      address: addressLine1,
      governorate,
      delegation,
      saveInfo: false,
      notes: ''
    };

    // Submit to Supabase - PASS userId CORRECTLY
    const order = await createOrderInDatabase(
      orderForDatabase,
      items,
      userId // Now properly handles NULL for guest orders
    );
    
    return {
      success: true,
      orderId: order.id,
      message: t('checkout.order_submitted'),
      timestamp: new Date().toISOString(),
      data: order
    };
  } catch (error) {
    console.error('Error submitting order:', error);
    toast.error(t('checkout.error.submit_failed'));
    throw error;
  }
};

export const formatOrderData = (
  order: CheckoutFormData, 
  items: CartItem[]
): FormattedOrderData => {
  // Format items as a string for the spreadsheet
  const itemsString = items
    .map(item => `${item.quantity}x ${item.name}${item.brand ? ` (${item.brand})` : ''} - ${formatPrice(item.price)} each`)
    .join('\n');
    
  // Calculate ONLY total (simplified - no shipping/tax/subtotal)
  const total = items.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  
  return {
    'Order Date': new Date().toISOString(),
    'Order ID': `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
    'Customer Name': `${order.firstName} ${order.lastName || ''}`,
    'Email': order.email || '',
    'Phone': order.phone,
    'Shipping Address': [
      order.address,
      `${order.delegation || ''}, ${order.governorate || ''}`
    ].filter(Boolean).join('\n'),
    'Billing Address': 'Same as shipping address',
    'Items': itemsString,
    'Total': formatPrice(total),
    'Order Status': 'Pending',
    'Timestamp': new Date().toISOString()
  };
};