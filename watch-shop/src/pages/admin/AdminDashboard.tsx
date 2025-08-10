import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProducts } from '../../context/ProductContext';
import { Product } from '../../types/product';
import { Order } from '../../types/order';
import { OrdersTab } from '../../components/admin/OrdersTab';
import { fetchMunicipalities } from '../../services/locationService';

export default function AdminDashboard() {
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
  const [activeTab, setActiveTab] = useState('products');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isDeleting, setIsDeleting] = useState<{[key: string]: boolean}>({});
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Load initial data
  useEffect(() => {
    console.log('AdminDashboard mounted, currentUser:', currentUser);
    
    if (!currentUser) {
      console.log('No current user, redirecting to login');
      navigate('/login', { state: { from: '/admin' } });
      return;
    }

    console.log('Loading data...');
    setError('');
    
    const loadData = async () => {
      try {
        // Load products
        await refreshProducts();
        console.log('Products loaded successfully');
        
        // Load orders (in a real app, this would be an API call)
        await loadOrders();
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      }
    };
    
    loadData();
  }, [currentUser, navigate, refreshProducts]);

  // Load orders (simulated for now)
  const loadOrders = async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data - in a real app, this would come from your API
      const mockOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'ORD-2023-001',
          userId: 'user1',
          items: [
            {
              productId: 'p1',
              name: 'Luxury Watch',
              price: 299.99,
              quantity: 1,
              image: '/images/watch1.jpg'
            }
          ],
          shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '+216 12 345 678',
            address: '123 Main St',
            city: 'Ariana',
            governorate: 'Ariana',
            delegation: 'Ariana Ville',
            postalCode: '2080',
            notes: 'Please call before delivery'
          },
          status: 'pending',
          paymentStatus: 'pending',
          subtotal: 299.99,
          shippingCost: 10.00,
          total: 309.99,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        // Add more mock orders as needed
      ];
      
      setOrders(mockOrders);
    } catch (err) {
      console.error('Error loading orders:', err);
      setOrdersError('Failed to load orders. Please try again later.');
    } finally {
      setOrdersLoading(false);
    }
  };

  // Handle order status update
  const handleUpdateOrderStatus = useCallback(async (orderId: string, status: Order['status']) => {
    try {
      // In a real app, this would be an API call to update the order status
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status, updatedAt: new Date().toISOString() } : order
        )
      );
      
      setSuccess('Order status updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating order status:', err);
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
      
      setSuccess('Product deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
    } finally {
      setIsDeleting(prev => ({ ...prev, [product.id!]: false }));
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

          {activeTab === 'orders' ? (
            <OrdersTab
              orders={orders}
              loading={ordersLoading}
              error={ordersError}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          ) : activeTab === 'users' ? (
            <div>
              <h2 className="text-lg font-medium text-gray-900">Users</h2>
              <p className="mt-2 text-sm text-gray-500">User management coming soon.</p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
