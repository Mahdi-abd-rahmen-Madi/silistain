import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart, CartItem as CartItemType } from '../context/CartContext';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';
import { CartItem } from './cart/CartItem';
import { CartSummary } from './cart/CartSummary';

export function Cart() {
  const { 
    cartItems, 
    isOpen, 
    closeCart, 
    removeFromCart, 
    updateQuantity,
    subtotal,
    tax,
    shipping,
    total,
    cartCount
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeCart}
        />
        
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ 
              type: 'tween', 
              ease: [0.16, 1, 0.3, 1],
              duration: 0.5,
              opacity: { duration: 0.3 }
            }}
            className="w-screen max-w-md relative z-[10000]"
            style={{
              // @ts-ignore - This is a valid CSS property
              '--tw-z-index': 10000,
              zIndex: 10000
            }}
          >
            <div className="absolute right-4 top-4 z-[10001]">
              <button
                onClick={closeCart}
                className="p-2 rounded-full bg-white shadow-lg text-gray-700 hover:bg-gray-100 transition-colors"
                aria-label="Close cart"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex h-full flex-col bg-white shadow-2xl">
              <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Your Cart</h2>
                  <p className="mt-1 text-sm text-gray-500">Review your items before checkout</p>
                </div>

                <div className="mt-8">
                  <div className="flow-root">
                    {cartCount === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
                        <p className="mt-1 text-sm text-gray-500">Start adding some items to your cart.</p>
                        <div className="mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={closeCart}
                            className="text-sm"
                          >
                            Continue Shopping
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ul className="-my-6 divide-y divide-gray-200">
                        {cartItems.map((item) => (
                          <li key={item.id}>
                            <CartItem
                              item={item}
                              onUpdateQuantity={updateQuantity}
                              onRemove={removeFromCart}
                              variant="drawer"
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {cartCount > 0 && (
                <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                  <CartSummary 
                    subtotal={subtotal}
                    tax={tax}
                    shipping={shipping}
                    total={total}
                    showTaxAndShipping={false}
                  />
                  <div className="mt-6">
                    <Link
                      to="/checkout"
                      className="flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-indigo-700"
                      onClick={closeCart}
                    >
                      Checkout
                    </Link>
                  </div>
                  <div className="mt-4 flex justify-center text-center text-sm text-gray-500">
                    <p>
                      or{' '}
                      <button
                        type="button"
                        className="font-medium text-indigo-600 hover:text-indigo-500"
                        onClick={closeCart}
                      >
                        Continue Shopping<span aria-hidden="true"> &rarr;</span>
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
