import { Link } from 'react-router-dom';
import { ArrowLeftIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart, CartItem as CartItemType } from '../context/CartContext';
import { CartItem } from '../components/cart/CartItem';
import { CartSummary } from '../components/cart/CartSummary';

export default function CartPage() {
  const { 
    cartItems, 
    removeFromCart, 
    updateQuantity,
    subtotal,
    tax,
    shipping,
    total,
    clearCart
  } = useCart();

  return (
    <div className="pt-24 pb-16 bg-white min-h-screen">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-black mb-8">Your Shopping Cart</h1>
        
        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCartIcon className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-medium text-black mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Looks like you haven't added any watches to your cart yet.</p>
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
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="space-y-6">
                    {cartItems.map((item) => (
                      <CartItem
                        key={item.id}
                        item={item}
                        onUpdateQuantity={updateQuantity}
                        onRemove={removeFromCart}
                        variant="page"
                      />
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
                  onClick={clearCart}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center text-sm"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <CartSummary 
                subtotal={subtotal}
                tax={tax}
                shipping={shipping}
                total={total}
                onCheckout={() => window.location.href = '/checkout'}
                checkoutLabel="Proceed to Checkout"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
