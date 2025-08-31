import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { Product } from '../../types/product';
import { Order } from '../../types/order';
import { OrdersTab } from '../../components/admin/OrdersTab';
import { HeroMediaManager } from '../../components/admin/HeroMediaManager';
import { fetchMunicipalities } from '../../services/locationService';
import { supabase, getAdminClient } from '../../lib/supabaseClient';

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
  
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'users' | 'hero'>('products');
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Tabs */}
        <div className="relative">
          <div className="overflow-x-auto pb-1 -mx-2 sm:mx-0">
            <nav className="flex space-x-1 sm:space-x-2 px-2 sm:px-0">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${
                  activeTab === 'products'
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Products
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Orders
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('hero')}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md whitespace-nowrap ${
                  activeTab === 'hero'
                    ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Hero Media
              </button>
            </nav>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-200 -z-10"></div>
        </div>

        <div className="flex-1 p-2 sm:p-4 md:p-6">
          {activeTab === 'products' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Products</h2>
                  <Link
                    to="/admin/products/new"
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Add Product
                  </Link>
                </div>
                
                {loading ? (
                  <div className="text-center py-4">Loading products...</div>
                ) : productsError ? (
                  <div className="text-red-500">{productsError}</div>
                ) : products.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No products found</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => (
                          <tr key={product.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  {product.images?.[0]?.url && (
                                    <img
                                      className="h-10 w-10 rounded-md object-cover"
                                      src={product.images[0].url}
                                      alt={product.name}
                                    />
                                  )}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {product.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {product.category}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ${product.price.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                (product.stock ?? 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {(product.stock ?? 0) > 0 ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <Link
                                to={`/admin/products/edit/${product.id}`}
                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                              >
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDeleteProduct(product)}
                                className="text-red-600 hover:text-red-900"
                                disabled={isDeleting[product.id!]}
                              >
                                {isDeleting[product.id!] ? 'Deleting...' : 'Delete'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Orders</h2>
                {ordersLoading ? (
                  <div className="text-center py-4">Loading orders...</div>
                ) : ordersError ? (
                  <div className="text-red-500">{ordersError}</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">No orders found</div>
                ) : (
                  <OrdersTab 
                    orders={orders} 
                    onUpdateOrderStatus={handleUpdateOrderStatus} 
                    loading={ordersLoading}
                    error={ordersError}
                  />
                )}
              </div>
            </div>
          )}
          
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900">Users</h2>
              <p className="mt-2 text-sm text-gray-500">User management coming soon.</p>
            </div>
          )}
          
          {activeTab === 'hero' && (
            <div className="bg-white rounded-lg shadow p-6">
              <HeroMediaManager />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
