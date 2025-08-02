import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Shop from './pages/Shop';
import WatchDetails from './pages/WatchDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import NotFound from './pages/NotFound';
import Footer from './components/Footer';
import { ToastProvider } from './components/ui/Toast';
import { Toaster } from './components/ui/Toaster';
import { ReactElement } from 'react';

function App(): ReactElement {
  return (
    <CartProvider>
      <ToastProvider>
        <Router>
          <div className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow">
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/watch/:id" element={<WatchDetails />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
            <Toaster />
          </div>
        </Router>
      </ToastProvider>
    </CartProvider>
  );
}

export default App;
