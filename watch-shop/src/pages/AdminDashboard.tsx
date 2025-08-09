import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductList from '../components/admin/ProductList';
import ProductForm from '../components/admin/ProductForm';
import ProductDetail from '../components/admin/ProductDetail';
import { useProducts } from '../context/ProductContext';

export default function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const { products } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold">Admin Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => navigate('/admin')}
                  className={`${isActive('/admin') && !isActive('/admin/orders') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Products
                  <span className="ml-2 bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                    {products.length}
                  </span>
                </button>
                <button
                  onClick={() => navigate('/admin/orders')}
                  className={`${isActive('/admin/orders') ? 'border-indigo-500 text-gray-900' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Orders
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-700">{currentUser?.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-6">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Routes>
            <Route 
              index 
              element={
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-gray-900">Products</h1>
                    <button
                      onClick={() => navigate('/admin/products/new')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Product
                    </button>
                  </div>
                  <ProductList />
                </div>
              } 
            />
            <Route 
              path="products/new" 
              element={
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
                  <ProductForm />
                </div>
              } 
            />
            <Route 
              path="products/edit/:id" 
              element={
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
                  <ProductForm isEditing={true} />
                </div>
              } 
            />
            <Route 
              path="products/:id" 
              element={
                <div className="space-y-6">
                  <ProductDetail />
                </div>
              } 
            />
            <Route 
              path="orders" 
              element={
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:p-6">
                      <p className="text-gray-500 text-center">Order management coming soon</p>
                    </div>
                  </div>
                </div>
              } 
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
