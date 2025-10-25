import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { Product } from '../../types/product';
import { Order } from '../../types/order';
import { OrdersTab } from '../../components/admin/OrdersTab';
import { HeroMediaManager } from '../../components/admin/HeroMediaManager';
import { ProductDropsManager } from '../../components/admin/ProductDropsManager';
import UsersTab from '../../components/admin/UsersTab';
import CategoriesTab from '../../components/admin/CategoriesTab';
import ProductList from '../../components/admin/ProductList';
import { fetchMunicipalities } from '../../services/locationService';
import { supabase, getAdminClient } from '../../lib/supabaseClient';
import { formatPrice } from '../../lib/utils';

interface AdminDashboardProps {}

export default function AdminDashboard({}: AdminDashboardProps) {
  const { currentUser, logout } = useAuth();
  const { 
    products, 
    loading, 
    error: productsError, 
    addProduct, 
    updateProduct, 
    deleteProduct,
    refreshProducts
  } = useProducts();
  
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'hero' | 'drops' | 'categories'>('products');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState<boolean>(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load initial data
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!currentUser) {
        navigate('/login', { state: { from: '/admin' } });
        return;
      }

      try {
        setError('');
        
        // Load products
        await refreshProducts();
        
        // Only proceed if component is still mounted
        if (isMounted) {
          // Load orders
          await loadOrders();
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error loading data:', err);
          setError(err instanceof Error ? err.message : 'Failed to load data');
        }
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [currentUser, navigate, refreshProducts]);

  // Load orders from Supabase
  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      
      console.log('Fetching orders from Supabase...');
      
      // Get the admin client
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }
      
      // Get the current session to check user role
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      // Use admin client for all order queries in admin dashboard
      const { data: ordersData, error, status, statusText } = await adminClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Supabase response:', { 
        status, 
        statusText, 
        data: ordersData, 
        error,
        isAdmin: session?.user?.user_metadata?.is_admin,
        userId: session?.user?.id
      });
      
      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      if (!ordersData) {
        console.warn('No orders data returned from Supabase');
        setOrders([]);
        return [];
      }
      
      console.log('Raw orders data:', ordersData);
      
      // Transform the data to match our Order type
      // Note: We're not using subtotal anymore since it was deleted from the database
      const formattedOrders: Order[] = ordersData.map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number || `ORD-${order.id.substring(0, 8).toUpperCase()}`,
        userId: order.user_id || 'guest',
        items: Array.isArray(order.items) ? order.items : [],
        shippingAddress: order.shipping_address || {},
        status: order.status || 'pending',
        paymentStatus: order.payment_status || 'pending',
        // Subtotal is no longer in the database, so we calculate it from items if needed
        subtotal: order.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0,
        shippingCost: order.shipping_cost !== undefined ? Number(order.shipping_cost) : 0,
        total: Number(order.total) || 0,
        createdAt: order.created_at,
        updatedAt: order.updated_at || order.created_at
      }));
      
      console.log('Formatted orders:', formattedOrders);
      setOrders(formattedOrders);
      return formattedOrders;
    } catch (err) {
      console.error('Error loading orders:', err);
      setOrdersError(err instanceof Error ? err.message : 'Failed to load orders');
      throw err; // Re-throw to be caught by the caller
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  // Handle order status update
  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    try {
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }
      
      // Update order status in the database
      const { error } = await adminClient
        .from('orders')
        .update({ 
          status,
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId);
      
      if (error) throw error;
      
      // Update local state
      setOrders((prevOrders: Order[]) =>
        prevOrders.map(order =>
          order.id === orderId ? { 
            ...order, 
            status, 
            updatedAt: new Date().toISOString() 
          } : order
        )
      );
      
      setSuccess(`Order ${orderId} status updated to ${status}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update order status');
    }
  }, []);

  // FIXED: Handle full order updates (no longer includes subtotal)
  const handleUpdateOrder = useCallback(async (updatedOrder: Order) => {
    try {
      setSuccess('');
      setError('');
      
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client not available');
      }
      
      // Prepare the data for Supabase - ONLY include columns that exist in your table
      // Subtotal was deleted from the database, so we don't include it here
      const orderData = {
        status: updatedOrder.status,
        payment_status: updatedOrder.paymentStatus,
        shipping_address: updatedOrder.shippingAddress,
        total: updatedOrder.total,
        updated_at: new Date().toISOString()
      };
      
      console.log('Updating order with ', orderData);
      
      // Update order in the database
      const { error } = await adminClient
        .from('orders')
        .update(orderData)
        .eq('id', updatedOrder.id);
      
      if (error) throw error;
      
      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
      
      setSuccess(`Order ${updatedOrder.orderNumber} updated successfully`);
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update order';
      console.error('Error updating order:', err);
      setError(errorMessage);
      throw err; // Re-throw so OrdersTab can handle it
    }
  }, []);

  // Show error from products context if any
  useEffect(() => {
    if (productsError) {
      setError(productsError);
    }
  }, [productsError]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out', err);
      setError('Failed to log out');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!product.id) return;
    
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      setIsDeleting(prev => ({ ...prev, [product.id!]: true }));
      setError('');
      
      await deleteProduct(product.id, product.images?.[0]?.url);
      
      setSuccess('Product deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete product');
    } finally {
      setIsDeleting((prev: Record<string, boolean>) => ({
        ...prev,
        [product.id!]: false
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center justify-between sm:justify-end gap-3">
              <span className="text-xs sm:text-sm text-gray-600 truncate max-w-[180px] sm:max-w-none">
                {currentUser?.email}
              </span>
              <button
                onClick={handleLogout}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 whitespace-nowrap"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Success and Error Messages */}
      {success && (
        <div className="fixed top-4 right-4 bg-green-50 border-l-4 border-green-400 p-4 z-50">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border-l-4 border-red-400 p-4 z-50">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Tabs */}
        <div className="relative">
          <div className="overflow-x-auto pb-1 -mx-2 sm:mx-0">
            <nav className="-mb-px flex space-x-4 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'products' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Products
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'categories' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Categories
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'orders' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Orders
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('users')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Users
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hero')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'hero' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Hero Media
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('drops')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'drops' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Product Drops
              </button>
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200 -z-10"></div>
        </div>

        <div className="flex-1 p-2 sm:p-4 md:p-6">
          {activeTab === 'products' && (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <ProductList />
            </div>
          )}
          {activeTab === 'categories' && <CategoriesTab />}
          {activeTab === 'orders' && (
            <OrdersTab 
              orders={orders} 
              loading={ordersLoading} 
              error={ordersError} 
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateOrder={async (order) => {
                // Implement order update logic here
                console.log('Updating order:', order);
                // Add your update logic here
              }}
            />
          )}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'hero' && <HeroMediaManager />}
          {activeTab === 'drops' && <ProductDropsManager />}
        </div>
      </main>
    </div>
  );
};