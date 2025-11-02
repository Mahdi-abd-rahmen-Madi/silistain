import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { OrdersProvider } from './context/OrdersContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetailsPage from './pages/ProductDetailsPage';
import CartPage from './pages/CartPage';
import FavoritesPage from './pages/FavoritesPage';
import Checkout from './pages/Checkout';
import ThankYou from './pages/ThankYou';
import Login from './pages/Login';
import Contact from './pages/Contact';
import AdminSignup from './pages/AdminSignup';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductForm from './components/admin/ProductForm';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Footer from './components/Footer';
import { Toaster } from 'react-hot-toast';
import { ReactElement } from 'react';
import { AdminProtectedRoute, ProtectedRoute } from './components/ProtectedRoute';
import Profile from './pages/profile';
import Orders from './pages/Orders';
import AuthCallback from './pages/auth/callback';
import VerifyEmail from './pages/auth/VerifyEmail';
import { CategoryProvider } from './context/CategoryContext';
import CategoryPage from './pages/category/[slug]';

function AppContent() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Navbar />}
      <Toaster
        position="top-center"
        containerStyle={{
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'auto',
          maxWidth: 'calc(100% - 2rem)',
        }}
        toastOptions={{
          style: {
            margin: '0',
            padding: '0.75rem 1rem',
            color: '#1f2937',
            maxWidth: '100%',
            width: 'auto',
            textAlign: 'center',
          },
          success: {
            duration: 3000,
          },
          error: {
            duration: 4000,
          },
        }}
      />
      <main className={`flex-grow ${isAdminRoute ? 'pt-0' : ''}`}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetailsPage />} />
            <Route path="/category/:slug" element={<CategoryPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/thank-you" element={<ThankYou />} />
            <Route path="/login" element={<Login />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/admin/signup" element={
              <ProtectedRoute>
                <AdminSignup />
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/account/orders" element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            } />
            <Route path="/favorites" element={
              <ProtectedRoute>
                <FavoritesPage />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/admin/messages" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminProtectedRoute>
                <AdminDashboard />
              </AdminProtectedRoute>
            } />
            <Route 
              path="/admin/products/new" 
              element={
                <AdminProtectedRoute>
                  <ProductForm />
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/products/edit/:id" 
              element={
                <AdminProtectedRoute>
                  <ProductForm isEditing productId={window.location.pathname.split('/').pop()} />
                </AdminProtectedRoute>
              } 
            />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
}

function App(): ReactElement {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <ProductProvider>
            <CategoryProvider>
              <CartProvider>
              <FavoritesProvider>
                <OrdersProvider>
                  <AppContent />
                </OrdersProvider>
              </FavoritesProvider>
            </CartProvider>
            </CategoryProvider>
          </ProductProvider>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
