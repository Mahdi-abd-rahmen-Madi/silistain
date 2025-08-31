import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
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
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/admin/products"
                  className={`border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/admin/products') ? 'border-indigo-500 text-gray-900' : ''
                  }`}
                >
                  Products
                </Link>
                <Link
                  to="/admin/orders"
                  className={`border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/admin/orders') ? 'border-indigo-500 text-gray-900' : ''
                  }`}
                >
                  Orders
                </Link>
                <Link
                  to="/admin/users"
                  className={`border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/admin/users') ? 'border-indigo-500 text-gray-900' : ''
                  }`}
                >
                  Users
                </Link>
                <Link
                  to="/admin/hero"
                  className={`border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive('/admin/hero') ? 'border-indigo-500 text-gray-900' : ''
                  }`}
                >
                  Hero Media
                </Link>
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
          <div className="space-y-6">
            <Routes>
              <Route index element={<Navigate to="products" replace />} />
              <Route path="dashboard" element={<Navigate to="/admin/products" replace />} />
              <Route path="products">
                <Route index element={<ProductList />} />
                <Route path="new" element={<ProductForm />} />
                <Route path=":id" element={<ProductDetail />} />
                <Route path=":id/edit" element={<ProductForm />} />
              </Route>
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
          </div>
        </main>
      </div>
    </div>
  );
}
