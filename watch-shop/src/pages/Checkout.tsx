import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { submitOrderToSheets, formatOrderData } from '../utils/api';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { CheckoutFormData, OrderDetails } from '../types';
import { CartItem } from '../context/CartContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    zipCode: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    saveInfo: false,
    shippingSameAsBilling: true,
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, type } = e.target;
    const value = type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
      
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Clear cart and reset form when component unmounts
  useEffect(() => {
    return () => {
      if (isSuccess) {
        clearCart();
      }
    };
  }, [isSuccess, clearCart]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Calculate total from cart items (10% tax + $29.99 shipping)
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.1;
      const shipping = 29.99;
      const total = subtotal + tax + shipping;
      
      // Create order details with all required properties
      const orderDetails: OrderDetails = {
        orderId: `ORD-${Date.now()}`,
        customerName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        total: total,
        items: cartItems.map(item => ({
          id: item.id,
          name: item.name || `Item ${item.id}`,
          quantity: item.quantity,
          price: item.price,
        })),
      };
      
      // Create a version of cart items with required brand for the API
      const cartItemsWithBrand = cartItems.map(item => ({
        ...item,
        brand: item.brand || 'Unknown Brand',
        name: item.name || `Item ${item.id}`
      }));
      
      // Format and submit the order data
      const orderData = formatOrderData(formData, cartItemsWithBrand);
      const response = await submitOrderToSheets(orderData);
      
      // Update order ID with the one from the API if available
      if (response?.orderId) {
        orderDetails.orderId = response.orderId;
      }
      
      setOrderDetails(orderDetails);
      setIsSuccess(true);
      
      // Clear the cart
      clearCart();
      
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('There was an error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="pt-24 pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
              <CheckCircleIcon className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Order Confirmed!</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Thank you for your purchase. Your order has been received and is being processed.
              {orderDetails && (
                <>
                  <br />
                  We've sent a confirmation email to <span className="font-medium">{orderDetails.email}</span>.
                </>
              )}
            </p>
            
            {orderDetails && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
                    <p className="font-medium">#{orderDetails.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Date</p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                    <p className="font-medium">${orderDetails.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Payment Method</p>
                    <p className="font-medium">Credit Card</p>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">What's next?</h4>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 text-left">
                    <p className="flex items-start">
                      <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">
                        <CheckCircleIcon className="h-5 w-5" />
                      </span>
                      We're processing your order and will send you a shipping confirmation email when your items are on their way.
                    </p>
                    <p className="flex items-start">
                      <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">
                        <CheckCircleIcon className="h-5 w-5" />
                      </span>
                      You can track your order status by clicking the button below.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/shop')}
                className="px-6 py-3 bg-accent hover:bg-accent-dark text-white font-medium rounded-lg transition-colors flex-1 sm:flex-none"
              >
                Continue Shopping
              </button>
              <button
                onClick={() => navigate('/account/orders')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-1 sm:flex-none"
              >
                Track Order
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Need help? <a href="/contact" className="text-accent hover:underline">Contact our support team</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-accent mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Cart
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Checkout</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Billing Details */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Billing Details</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        ZIP / Postal Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        required
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="country"
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                    >
                      <option value="">Select a country</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="UK">United Kingdom</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                      <option value="JP">Japan</option>
                      <option value="CH">Switzerland</option>
                      <option value="AE">United Arab Emirates</option>
                    </select>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="saveInfo"
                      name="saveInfo"
                      checked={formData.saveInfo}
                      onChange={handleChange}
                      className="h-4 w-4 text-accent focus:ring-accent border-gray-300 dark:border-gray-600 rounded"
                    />
                    <label htmlFor="saveInfo" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Save this information for next time
                    </label>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Payment Method</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    All transactions are secure and encrypted.
                  </p>
                </div>
                <div className="p-6 space-y-6">
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <input
                        id="credit-card"
                        name="payment-method"
                        type="radio"
                        className="h-4 w-4 text-accent focus:ring-accent border-gray-300 dark:border-gray-600"
                        defaultChecked
                      />
                      <label htmlFor="credit-card" className="ml-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Credit / Debit Card
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Card Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="cardNumber"
                          name="cardNumber"
                          required
                          value={formData.cardNumber}
                          onChange={handleChange}
                          placeholder="1234 5678 9012 3456"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                        />
                      </div>

                      <div>
                        <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Name on Card <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="cardName"
                          name="cardName"
                          required
                          value={formData.cardName}
                          onChange={handleChange}
                          placeholder="John Smith"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="expiryDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Expiry Date <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="expiryDate"
                            name="expiryDate"
                            required
                            value={formData.expiryDate}
                            onChange={handleChange}
                            placeholder="MM/YY"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                          />
                        </div>
                        <div>
                          <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            CVV <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="cvv"
                            name="cvv"
                            required
                            value={formData.cvv}
                            onChange={handleChange}
                            placeholder="123"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Order Summary</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium">$16,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                      <span className="font-medium">$29.99</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="font-medium">$1,600.00</span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold">Total</span>
                        <span className="text-lg font-bold">$17,629.99</span>
                      </div>
                    </div>
                  </div>

                  {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg text-sm">
                <div className="flex items-center">
                  <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-6 py-3 px-6 rounded-lg font-medium text-white ${
                isSubmitting 
                  ? 'bg-accent/80 cursor-not-allowed' 
                  : 'bg-accent hover:bg-accent-dark'
              } transition-colors flex items-center justify-center`}
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                  Processing...
                </>
              ) : (
                'Place Order'
              )}
            </button>

                  <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    By placing your order, you agree to our{' '}
                    <a href="/terms" className="text-accent hover:underline">Terms of Service</a> and{' '}
                    <a href="/privacy" className="text-accent hover:underline">Privacy Policy</a>.
                  </p>
                </div>
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Your Order</h2>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Order Items */}
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src="/images/watches/rolex-submariner.jpg"
                          alt="Rolex Submariner"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Rolex Submariner</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">1 × $9,100.00</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <img
                          src="/images/watches/cartier-santos.jpg"
                          alt="Cartier Santos"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Cartier Santos</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">1 × $6,900.00</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Totals */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                      <span className="font-medium">$16,000.00</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                      <span className="font-medium">$29.99</span>
                    </div>
                    <div className="flex justify-between py-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax</span>
                      <span className="font-medium">$1,600.00</span>
                    </div>
                    <div className="flex justify-between py-3 text-base font-bold border-t border-gray-200 dark:border-gray-700 mt-2">
                      <span>Total</span>
                      <span>$17,629.99</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Security */}
            <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Secure Payment</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Your payment information is processed securely. We do not store credit card details.
                </p>
                <div className="flex space-x-4">
                  <div className="h-8">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/visa/visa-original.svg" alt="Visa" className="h-full" />
                  </div>
                  <div className="h-8">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/mastercard/mastercard-original.svg" alt="Mastercard" className="h-full" />
                  </div>
                  <div className="h-8">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/apple/apple-original.svg" alt="Apple Pay" className="h-full" />
                  </div>
                  <div className="h-8">
                    <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/google/google-original.svg" alt="Google Pay" className="h-full" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-300">Secure SSL Encryption</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
