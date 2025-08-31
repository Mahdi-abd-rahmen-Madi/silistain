import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabaseClient';

export interface ProductImage {
  url: string;
  isPrimary?: boolean;
  order?: number;
  preview?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  brand?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    images?: Array<{ url: string; isPrimary?: boolean } | string>;
  };
}

export interface Order {
  id: string;
  order_number?: string;
  user_id: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | string;
  payment_status?: 'pending' | 'paid' | 'refunded' | 'failed' | string;
  total: number;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  order_items?: OrderItem[]; // For backward compatibility
  shipping_address?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    governorate: string;
    zipCode: string;
  };
}

interface OrdersContextType {
  orders: Order[];
  loading: boolean;
  error: string | null;
  fetchRecentOrders: (limit?: number) => Promise<void>;
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchRecentOrders = useCallback(async (limit: number = 2) => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Please sign in to view your orders');
        setOrders([]);
        return;
      }

      // Fetch orders using the same query as in Orders.tsx
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .or(`user_id.eq.${session.user.id},user_id.is.null`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (ordersError) throw ordersError;
      
      if (!ordersData?.length) {
        setOrders([]);
        return;
      }

      // Format the orders to match the expected structure
      const formattedOrders = ordersData.map(order => {
        // Calculate total as sum of (quantity * price) for all items
        const calculatedTotal = order.items?.reduce((sum: number, item: { price: number; quantity?: number }) => {
          return sum + (item.price * (item.quantity || 1));
        }, 0) || order.total || 0;

        return {
          ...order,
          // Ensure we have items/order_items array even if empty
          items: order.items || [],
          order_items: order.order_items || order.items || [],
          // Use calculated total if available, otherwise fall back to the stored total
          total: calculatedTotal
        };
      });

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Load orders when component mounts or user changes
  useEffect(() => {
    if (currentUser?.id) {
      fetchRecentOrders();
    } else {
      setOrders([]);
    }
  }, [currentUser?.id, fetchRecentOrders]);

  return (
    <OrdersContext.Provider value={{ 
      orders, 
      loading, 
      error, 
      fetchRecentOrders 
    }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrdersContext);
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider');
  }
  return context;
}
