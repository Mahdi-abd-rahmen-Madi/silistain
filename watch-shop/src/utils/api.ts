import { toast } from 'react-hot-toast';
import { CheckoutFormData } from '../types';
import { CartItem } from '../context/CartContext';

// Base URL for the Sheet.best API
const SHEET_BEST_API = 'https://sheet.best/api/sheets';

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

/**
 * Submits order data to Google Sheets via Sheet.best
 * @param {Object} orderData - The order data to submit
 * @returns {Promise<Object>} - The response from the API
 */
export const submitOrderToSheets = async (orderData: FormattedOrderData): Promise<ApiResponse> => {
  try {
    // In a real app, you would use your Sheet.best API key here
    // const SHEET_ID = import.meta.env.VITE_SHEET_BEST_ID;
    // const response = await fetch(`${SHEET_BEST_API}/${SHEET_ID}`, {
    
    // For demo purposes, we'll simulate a successful API call
    console.log('Submitting order to Google Sheets:', orderData);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a random order ID for demo purposes
    const orderId = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    
    // In a real app, you would return the actual API response
    return {
      success: true,
      orderId,
      message: 'Order submitted successfully',
      timestamp: new Date().toISOString(),
      data: orderData
    };
    
    // Uncomment this in production:
    // const response = await fetch(`${SHEET_BEST_API}/${SHEET_ID}`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${import.meta.env.VITE_SHEET_BEST_TOKEN}`
    //   },
    //   body: JSON.stringify(orderData)
    // });
    
    // if (!response.ok) {
    //   throw new Error('Failed to submit order');
    // }
    
    // return await response.json();
  } catch (error) {
    console.error('Error submitting order to Google Sheets:', error);
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
  const shipping = 29.99;
  const total = subtotal + tax + shipping;
  
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
    'Shipping': `$${shipping.toFixed(2)}`,
    'Total': `$${total.toFixed(2)}`,
    'Payment Method': 'Credit Card',
    'Payment Status': 'Paid',
    'Order Status': 'Processing',
    'Notes': typeof order.notes === 'string' ? order.notes : 'No additional notes',
    'Timestamp': new Date().toISOString()
  };
};
