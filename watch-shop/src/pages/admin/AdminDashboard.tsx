import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { Product } from '../../types/product';
import { Order } from '../../types/order';
import { OrdersTab } from '../../components/admin/OrdersTab';
import { fetchMunicipalities } from '../../services/locationService';
import { supabase, supabaseAdmin } from '../../utils/supabaseClient';

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
  
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users'>('products');
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
  }, [currentUser, navigate]);

  // Load orders from Supabase
  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      
      if (!supabaseAdmin) {
        throw new Error('Admin client not available');
      }
      
      console.log('Fetching orders from Supabase...');
      
      // Get the current session to check user role
      const { data: { session } } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      // Use admin client for all order queries in admin dashboard
      const { data: ordersData, error, status, statusText } = await supabaseAdmin
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
      const formattedOrders: Order[] = ordersData.map((order: any) => ({
        id: order.id,
        orderNumber: order.order_number || `ORD-${order.id.substring(0, 8).toUpperCase()}`,
        userId: order.user_id || 'guest',
        items: Array.isArray(order.items) ? order.items : [],
        shippingAddress: order.shipping_address || {},
        status: order.status || 'pending',
        paymentStatus: order.payment_status || 'pending',
        subtotal: Number(order.subtotal) || 0,
        shippingCost: Number(order.shipping_cost) || 0,
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
      if (!supabaseAdmin) {
        throw new Error('Admin client not available');
      }
      
      // Update order status in the database
      const { error } = await supabaseAdmin
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Logged in as: {currentUser?.email}
            </span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('products')}
              className={`${
                activeTab === 'products'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Products
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`${
                activeTab === 'orders'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Users
            </button>
          </nav>
        </div>

        {/* Tab Panels */}
        <div className="mt-8">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
              {success}
            </div>
          )}

          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Products</h2>
                <Link
                  to="/admin/products/new"
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Add Product
                </Link>
              </div>
              
              {loading && products.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                  <p className="text-gray-500">Loading products...</p>
                </div>
              ) : error ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    {products.map((product) => (
                      <li key={product.id} className="hover:bg-gray-50">
                        <div className="px-4 py-4 sm:px-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {product.images?.[0]?.url ? (
                                <img
                                  className="h-16 w-16 rounded-md object-cover"
                                  src={product.images[0].url}
                                  alt={product.name}
                                />
                              ) : (
                                <div className="h-16 w-16 bg-gray-200 rounded-md flex items-center justify-center text-gray-400">
                                  <span>No Image</span>
                                </div>
                              )}
                              <div className="ml-4">
                                <h3 className="text-sm font-medium text-indigo-600">
                                  {product.name}
                                </h3>
                                <div className="mt-2 sm:flex sm:justify-between">
                                  <div className="sm:flex">
                                    <p className="text-sm text-gray-500">
                                      {product.description || 'No description available'}
                                    </p>
                                  </div>
                                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                    <span>
                                      Last updated: {product.updatedAt ? new Date(product.updatedAt).toLocaleString() : 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-500">
                                  ${product.price.toFixed(2)}
                                </p>
                                {product.stock !== undefined && (
                                  <p className="text-xs text-gray-500">
                                    Stock: {product.stock}
                                  </p>
                                )}
                                {product.featured && (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                    Featured
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Link
                                to={`/admin/products/edit/${product.id}`}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(product)}
                                disabled={isDeleting[product.id!]}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {isDeleting[product.id!] ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'orders' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-6">Orders</h2>
              {ordersLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
                </div>
              ) : ordersError ? (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">
                        {ordersError}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <OrdersTab
                  orders={orders}
                  loading={ordersLoading}
                  error={ordersError}
                  onUpdateOrderStatus={handleUpdateOrderStatus}
                />
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900">Users</h2>
              <p className="mt-2 text-sm text-gray-500">User management coming soon.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
