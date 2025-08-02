import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon, ShoppingCartIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import watches from '../data/watches';
import { Watch } from '../types';

interface CartItem {
  id: number;
  quantity: number;
}

interface CartTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

interface CartItemWithDetails extends Watch {
  quantity: number;
}

const Cart = () => {
  // This would normally come from a global state or context
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { id: 1, quantity: 1 },
    { id: 4, quantity: 2 },
  ]);

  // Calculate cart totals
  const calculateTotals = (): CartTotals => {
    const subtotal = cartItems.reduce((sum, item) => {
      const watch = watches.find(w => w.id === item.id);
      return sum + (watch ? watch.price * item.quantity : 0);
    }, 0);

    const shipping = subtotal > 0 ? 29.99 : 0; // Free shipping over $500 could be added
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  };

  const { subtotal, shipping, tax, total } = calculateTotals();

  // Update item quantity
  const updateQuantity = (id: number, newQuantity: number): void => {
    if (newQuantity < 1) return;
    
    setCartItems(cartItems.map(item => 
      item.id === id ? { ...item, quantity: newQuantity } : item
    ));
  };

  // Remove item from cart
  const removeItem = (id: number): void => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  // Get watch details for cart items
  const getCartItemsWithDetails = (): CartItemWithDetails[] => {
    return cartItems
      .map(item => {
        const watch = watches.find(w => w.id === item.id);
        return watch ? { ...watch, quantity: item.quantity } : null;
      })
      .filter((item): item is CartItemWithDetails => item !== null);
  };

  const cartItemsWithDetails = getCartItemsWithDetails();

  return (
    <div className="pt-24 pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Your Shopping Cart</h1>
        
        {cartItemsWithDetails.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCartIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-medium text-gray-900 dark:text-white mb-2">Your cart is empty</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Looks like you haven't added any watches to your cart yet.</p>
            <Link
              to="/shop"
              className="inline-block bg-accent hover:bg-accent-dark text-white font-medium py-2 px-6 rounded-lg transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="hidden md:grid grid-cols-12 gap-4 mb-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <div className="col-span-5">Product</div>
                    <div className="col-span-2 text-center">Price</div>
                    <div className="col-span-3 text-center">Quantity</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {cartItemsWithDetails.map((item) => (
                      <div key={item.id} className="py-6">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          {/* Product Image and Info */}
                          <div className="flex-shrink-0 w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                            <img
                              src={item.image}
                              alt={`${item.brand} ${item.name}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <Link
                              to={`/watch/${item.id}`}
                              className="text-lg font-medium text-gray-900 dark:text-white hover:text-accent transition-colors"
                            >
                              {item.brand} {item.name}
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {item.category}
                            </p>
                            <button
                              onClick={() => removeItem(item.id)}
                              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Remove
                            </button>
                          </div>

                          {/* Price */}
                          <div className="md:text-center">
                            <span className="md:hidden text-sm text-gray-500 dark:text-gray-400 mr-2">Price:</span>
                            <span className="font-medium">${item.price.toLocaleString()}</span>
                          </div>

                          {/* Quantity */}
                          <div className="flex items-center justify-between md:justify-center">
                            <span className="md:hidden text-sm text-gray-500 dark:text-gray-400">Quantity:</span>
                            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                -
                              </button>
                              <span className="px-3 py-1 w-12 text-center">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-3 py-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="text-right">
                            <span className="md:hidden text-sm text-gray-500 dark:text-gray-400 mr-2">Total:</span>
                            <span className="font-medium">${(item.price * item.quantity).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-between">
                <Link
                  to="/shop"
                  className="flex items-center text-gray-600 dark:text-gray-300 hover:text-accent transition-colors"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-2" />
                  Continue Shopping
                </Link>
                <button
                  onClick={() => setCartItems([])}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center text-sm"
                >
                  <XMarkIcon className="h-4 w-4 mr-1" />
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Order Summary</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                      <span className="font-medium">${shipping.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-lg font-bold">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <Link
                      to="/checkout"
                      className="block w-full bg-accent hover:bg-accent-dark text-white text-center font-medium py-3 px-6 rounded-lg transition-colors"
                    >
                      Proceed to Checkout
                    </Link>
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                      or{' '}
                      <Link to="/shop" className="text-accent hover:underline">
                        continue shopping
                      </Link>
                    </p>
                  </div>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Have a Promo Code?</h3>
                  <div className="flex">
                    <input
                      type="text"
                      placeholder="Enter promo code"
                      className="flex-1 px-4 py-2 border border-r-0 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                    <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-medium rounded-r-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
