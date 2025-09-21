import { useState } from 'react';
import { CartItem } from '../context/CartContext';
import { Dialog } from '@headlessui/react';
import { formatPrice } from '../lib/utils';
import { useTranslation } from 'react-i18next';

interface OrderSummaryProps {
  cartItems: CartItem[];
  isSubmitting?: boolean;
  error?: string | null;
  onSubmit?: () => void;
  appliedCoupon?: {
    code: string;
    amount: number;
  } | null;
  onRemoveCoupon?: () => void;
}

export const OrderSummary = ({ 
  cartItems, 
  isSubmitting = false, 
  error = null, 
  onSubmit,
  appliedCoupon = null,
  onRemoveCoupon
}: OrderSummaryProps) => {
  const { t } = useTranslation();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  
  const handleConfirm = () => {
    if (onSubmit) {
      setIsConfirmOpen(true);
    }
  };
  
  const handleSubmitOrder = () => {
    setIsConfirmOpen(false);
    if (onSubmit) {
      onSubmit();
    }
  };
  
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = appliedCoupon?.amount || 0;
  const total = Math.max(0, subtotal - discount);

  return (
    <div className="lg:col-span-1">
      <div className="sticky top-8 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-medium text-gray-900 dark:text-white">
              {t('checkout.order_summary.title')}
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {/* Order Items */}
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                      <img
                        src={item.image as string || "/images/watches/default-watch.jpg"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('checkout.order_summary.quantity')}: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
 {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Order Total */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center text-xl font-semibold">
                <span>{t('checkout.order_summary.total')}</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Place Order Button */}
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting || cartItems.length === 0}
              className="mt-6 w-full bg-accent text-white py-3 px-4 rounded-lg font-medium hover:bg-accent/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('checkout.order_summary.processing')}
                </span>
              ) : (
                t('checkout.order_summary.proceed_to_checkout')
              )}
            </button>

            {/* Confirmation Dialog */}
            <Dialog
              open={isConfirmOpen}
              onClose={() => !isSubmitting && setIsConfirmOpen(false)}
              className="relative z-50"
            >
              <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
              <div className="fixed inset-0 flex items-center justify-center p-4">
                <Dialog.Panel className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6">
                  <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                    Confirm Your Order
                  </Dialog.Title>
                  <Dialog.Description className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    Are you sure you want to place this order? This action cannot be undone.
                  </Dialog.Description>

                  <div className="mt-6 space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">Order Summary</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                          <span>{formatPrice(subtotal)}</span>
                        </div>
                        <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 dark:border-gray-700 font-medium">
                          <span>Total</span>
                          <span>{formatPrice(total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsConfirmOpen(false)}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitOrder}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-accent border border-transparent rounded-md shadow-sm hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent disabled:opacity-50"
                    >
                      {isSubmitting ? 'Placing Order...' : 'Confirm Order'}
                    </button>
                  </div>
                </Dialog.Panel>
              </div>
            </Dialog>

            <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              By placing your order, you agree to our{' '}
              <a href="/terms" className="text-accent hover:underline">Terms of Service</a> and{' '}
              <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
