import { XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart, CartItem as CartItemType } from '../context/CartContext';
import { motion } from 'framer-motion';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';
import { CartItem } from './cart/CartItem';
import { CartSummary } from './cart/CartSummary';
import { useTranslation } from 'react-i18next';

export function Cart() {
  const { t } = useTranslation();
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
    <div className="fixed inset-0 z-[99999] overflow-hidden touch-none" style={{ zIndex: 99999 }}>
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeCart}
        />
        
        <div className="fixed inset-0 flex justify-end sm:pl-10">
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
            className="w-full max-w-full sm:max-w-md relative z-[10000] h-full flex flex-col"
            style={{
              zIndex: 10000,
              maxHeight: '100vh',
              WebkitOverflowScrolling: 'touch',
              msOverflowStyle: 'none',
              scrollbarWidth: 'none' as any,
            } as any}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex-shrink-0 bg-white shadow-sm p-2 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900 px-2">{t('cart.title')}</h2>
              <button
                onClick={closeCart}
                className="p-2 rounded-full bg-white hover:bg-gray-100 transition-colors"
                aria-label="Close cart"
              >
                <XMarkIcon className="h-6 w-6 text-gray-700" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-4 sm:p-6">
                {cartCount > 0 && (
                  <p className="text-sm text-gray-500 text-center mb-4">{t('cart.review_items')}</p>
                )}

                <div className="mt-2">
                  <div className="flow-root">
                    {cartCount === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingCartIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">{t('cart.empty')}</h3>
                        <p className="mt-1 text-sm text-gray-500">{t('cart.start_adding')}</p>
                        <div className="mt-6">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={closeCart}
                            className="text-sm"
                          >
                            {t('cart.continue_shopping')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <ul className="divide-y divide-gray-200">
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
                <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="mb-4">
                  <CartSummary 
                    subtotal={subtotal}
                    tax={tax}
                    shipping={shipping}
                    total={total}
                    showTaxAndShipping={false}
                  />
                </div>
                <div className="space-y-3">
                  <Link
                    to="/checkout"
                    className="block w-full text-center rounded-lg bg-indigo-600 px-6 py-3.5 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    onClick={closeCart}
                  >
                    {t('cart.checkout')}
                  </Link>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-500 py-2"
                  >
                    {t('cart.or_continue_shopping')}
                  </button>
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
