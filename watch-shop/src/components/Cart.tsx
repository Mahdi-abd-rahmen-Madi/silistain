import { XMarkIcon, MinusIcon, PlusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';

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
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeCart} />
        
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            className="w-screen max-w-md"
          >
            <div className="flex h-full flex-col bg-white shadow-xl">
              <div className="flex-1 overflow-y-auto py-6 px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-900">Shopping cart</h2>
                  <div className="ml-3 flex h-7 items-center">
                    <button
                      type="button"
                      className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                      onClick={closeCart}
                    >
                      <span className="sr-only">Close panel</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
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
                          <li key={item.id} className="flex py-6">
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                              <img
                                src={item.image as string || '/placeholder-watch.jpg'}
                                alt={item.name}
                                className="h-full w-full object-cover object-center"
                              />
                            </div>

                            <div className="ml-4 flex flex-1 flex-col">
                              <div>
                                <div className="flex justify-between text-base font-medium text-gray-900">
                                  <h3>{item.name}</h3>
                                  <p className="ml-4">${item.price.toFixed(2)}</p>
                                </div>
                                {item.brand && <p className="mt-1 text-sm text-gray-500">{item.brand}</p>}
                              </div>
                              <div className="flex flex-1 items-end justify-between text-sm">
                                <div className="flex items-center border rounded-md">
                                  <button
                                    type="button"
                                    className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  >
                                    <MinusIcon className="h-4 w-4" />
                                  </button>
                                  <span className="px-3 py-1">{item.quantity}</span>
                                  <button
                                    type="button"
                                    className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  >
                                    <PlusIcon className="h-4 w-4" />
                                  </button>
                                </div>

                                <div className="flex">
                                  <button
                                    type="button"
                                    className="font-medium text-indigo-600 hover:text-indigo-500"
                                    onClick={() => removeFromCart(item.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              {cartCount > 0 && (
                <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                  <div className="flex justify-between text-base font-medium text-gray-900">
                    <p>Subtotal</p>
                    <p>${subtotal.toFixed(2)}</p>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <p>Shipping</p>
                    <p>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</p>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-1">
                    <p>Tax</p>
                    <p>${tax.toFixed(2)}</p>
                  </div>
                  <div className="mt-4 flex justify-between text-base font-medium text-gray-900 border-t border-gray-200 pt-4">
                    <p>Total</p>
                    <p>${total.toFixed(2)}</p>
                  </div>
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
