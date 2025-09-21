import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/utils';

export default function CartSidebar() {
  const { 
    isOpen, 
    closeCart, 
    cartItems, 
    removeFromCart, 
    updateQuantity,
    subtotal,
    tax,
    total,
    shipping,
    cartCount
  } = useCart();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={closeCart}>
        <Transition.Child
          as={Fragment}
          enter="ease-in-out duration-500"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in-out duration-500"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                    <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-lg font-medium text-gray-900">
                          Shopping cart
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative -m-2 p-2 text-gray-400 hover:text-gray-500"
                            onClick={closeCart}
                          >
                            <span className="absolute -inset-0.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-8">
                        <div className="flow-root">
                          {cartCount === 0 ? (
                            <div className="text-center py-12">
                              <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
                              <p className="mt-1 text-sm text-gray-500">Start adding some items to your cart.</p>
                              <div className="mt-6">
                                <button
                                  type="button"
                                  onClick={closeCart}
                                  className="inline-flex items-center rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                                >
                                  Continue Shopping
                                </button>
                              </div>
                            </div>
                          ) : (
                            <ul role="list" className="-my-6 divide-y divide-gray-200">
                              {cartItems.map((item) => (
                                <li key={item.id} className="flex py-6">
                                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="h-full w-full object-cover object-center"
                                    />
                                  </div>

                                  <div className="ml-4 flex flex-1 flex-col">
                                    <div>
                                      <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>
                                          <Link to={`/watch/${item.id}`} onClick={closeCart}>
                                            {item.name}
                                          </Link>
                                        </h3>
                                        <p className="text-gray-500">{formatPrice(item.price * item.quantity)}</p>
                                      </div>
                                      <p className="mt-1 text-sm text-gray-500">{item.brand}</p>
                                    </div>
                                    <div className="flex flex-1 items-end justify-between text-sm">
                                      <div className="flex items-center">
                                        <label htmlFor={`quantity-${item.id}`} className="sr-only">
                                          Quantity
                                        </label>
                                        <select
                                          id={`quantity-${item.id}`}
                                          name={`quantity-${item.id}`}
                                          className="max-w-full rounded-md border border-gray-300 py-1.5 text-left text-base font-medium leading-5 text-gray-700 shadow-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:text-sm"
                                          value={item.quantity}
                                          onChange={(e) => updateQuantity(item.id, parseInt(e.target.value))}
                                        >
                                          {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                                            <option key={num} value={num}>
                                              {num}
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      <div className="flex">
                                        <button
                                          type="button"
                                          className="font-medium text-accent hover:text-accent-dark"
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
                      <div className="border-t border-gray-200 px-4 py-6 sm:px-6">
                        <div className="flex justify-between text-base font-medium text-gray-900">
                          <p>Subtotal</p>
                          <p>{formatPrice(subtotal)}</p>
                        </div>
                        {shipping > 0 && (
                          <div className="flex justify-between text-sm text-gray-500 mt-2">
                            <p>Shipping</p>
                            <p>{formatPrice(shipping)}</p>
                          </div>
                        )}
                        {tax > 0 && (
                          <div className="flex justify-between text-sm text-gray-500 mt-1">
                            <p>Tax</p>
                            <p>{formatPrice(tax)}</p>
                          </div>
                        )}
                        <div className="flex justify-between text-lg font-bold text-gray-900 mt-4 pt-4 border-t border-gray-200">
                          <p>Total</p>
                          <p>{formatPrice(total)}</p>
                        </div>
                        <div className="mt-6">
                          <Link
                            to="/checkout"
                            onClick={closeCart}
                            className="flex items-center justify-center rounded-md border border-transparent bg-accent px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-accent-dark w-full"
                          >
                            Checkout
                          </Link>
                        </div>
                        <div className="mt-4 flex justify-center text-center text-sm text-gray-500">
                          <p>
                            or{' '}
                            <button
                              type="button"
                              className="font-medium text-accent hover:text-accent-dark"
                              onClick={closeCart}
                            >
                              Continue Shopping
                              <span aria-hidden="true"> &rarr;</span>
                            </button>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
