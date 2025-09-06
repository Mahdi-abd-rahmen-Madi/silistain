import { useState, useEffect, ChangeEvent, FormEvent, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { submitOrderToSheets, formatOrderData } from '../utils/api';
import { createOrderInDatabase } from '../services/orderService';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { OrderSummary } from '../components/OrderSummary';
import { fetchMunicipalities, getGovernorates, getDelegations, getCities } from '../services/locationService';
import type { Municipality } from '../types/order';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

import { CheckoutFormData } from '../types/checkout';
import { CartItem } from '../types/cart';

// Add this interface to fix the "Cannot find name 'OrderDetails'" error
interface OrderDetails {
  orderId: string;
  customerName: string;
  email: string;
  total: number;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
  }[];
}

// Form field types
interface FormFields {
  firstName: string;
  lastName?: string | undefined;
  email?: string;
  phone: string;
  address: string;
  governorate: string;
  delegation: string;
  zipCode: string;
  saveInfo: boolean;
  [key: string]: string | boolean | undefined;
};

interface Delegation {
  name: string;
  delegation: string;
  governorate: string;
}

type LocalMunicipality = Omit<Municipality, 'id' | 'created_at'>;

const Checkout = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [municipalities, setMunicipalities] = useState<LocalMunicipality[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormFields>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    governorate: '',
    delegation: '',
    zipCode: '',
    saveInfo: false,
  });

  // Check if user is authenticated when component mounts
  useEffect(() => {
    if (!currentUser) {
      setError(t('checkout.error.not_authenticated'));
      // Redirect to login after a short delay to show the error
      const timer = setTimeout(() => {
        navigate('/login', { state: { from: '/checkout' } });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [currentUser, navigate, t]);

  // Fetch all municipalities on component mount
  const loadMunicipalities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMunicipalities();
      setMunicipalities(data);
    } catch (err) {
      console.error('Error fetching municipalities:', err);
      setError(t('checkout.error.location_data'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMunicipalities();
  }, [loadMunicipalities]);

  // Get unique governorates from municipalities
  const governorates = useMemo(() => {
    return Array.from(new Set(municipalities.map(m => m.governorate))).sort();
  }, [municipalities]);

  // Handle governorate change
  const handleGovernorateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    handleGovernorateSelect(value);
  };

  const handleGovernorateSelect = (governorate: string) => {
    setFormData(prev => ({
      ...prev,
      governorate,
      delegation: '',
      city: ''
    }));
    
    // Manually trigger the delegation loading
    if (governorate) {
      getDelegations(governorate)
        .then((delegations: string[]) => {
          setDelegations(delegations.map((d: string) => ({
            name: d,
            delegation: d,
            governorate
          })));
        })
        .catch((err: Error) => {
          console.error('Error loading delegations:', err);
          setError(t('checkout.error.delegations'));
        });
    } else {
      setDelegations([]);
    }
  };

  // Handle delegation change
  const handleDelegationChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      delegation: value
    }));
  };

  // Handle form field changes
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Form submission handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate user is authenticated
    if (!currentUser) {
      setError(t('checkout.error.not_authenticated'));
      setIsSubmitting(false);
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }

    // Validate required fields
    if (!formData.firstName || !formData.phone || !formData.address || 
        !formData.governorate || !formData.delegation) {
      setError(t('checkout.error.missing_fields'));
      setIsSubmitting(false);
      return;
    }

    try {
      // Calculate total - ONLY sum of items (NO tax or shipping)
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // FIX: Ensure cart items have required brand AND name properties
      const itemsWithBrand = cartItems.map(item => ({
        ...item,
        brand: item.brand || t('product.unknown_brand'),
        name: item.name || t('product.unknown_product') // Add this fallback to ensure name is always a string
      }));
      
      // Format the order data with all required fields
      const orderFormData: CheckoutFormData = {
        ...formData,
        email: formData.email || currentUser.email || ''
      };
      
      // Create order in database first (critical step - saves user_id)
      const databaseOrder = await createOrderInDatabase(
        orderFormData, 
        itemsWithBrand, 
        currentUser.id
      );
      
      // Format order data for Google Sheets with database order ID
      const orderData = formatOrderData(orderFormData, itemsWithBrand);
      
      // Submit to Google Sheets for backup/reporting
      const response = await submitOrderToSheets(orderData, t);
      
      // Handle success - create proper OrderDetails object
      const orderDetails: OrderDetails = {
        orderId: response?.orderId || databaseOrder.id,
        customerName: `${formData.firstName} ${formData.lastName || ''}`,
        email: formData.email || currentUser.email || '',
        total: total,
        items: cartItems.map(item => ({
          id: Number(item.id) || 0,
          name: item.name || t('product.unknown_product'),
          quantity: item.quantity,
          price: item.price
        }))
      };
      
      setOrderDetails(orderDetails);
      setIsSuccess(true);
      clearCart();
      
    } catch (err: any) {
      console.error('Error submitting order:', err);
      setError(err.message || t('checkout.error.submit_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="pt-24 pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-8 text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('checkout.error.not_authenticated_title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            {t('checkout.error.not_authenticated_message')}
          </p>
          <button
            onClick={() => navigate('/login', { state: { from: '/checkout' } })}
            className="px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors"
          >
            {t('auth.sign_in')}
          </button>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="pt-24 pb-16 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-8 text-center">
            <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {t('checkout.order_confirmed')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              {t('checkout.thank_you')}
              {orderDetails && (
                <>
                  <br />
                  {t('checkout.confirmation_sent', { email: orderDetails.email })}
                </>
              )}
            </p>

            {orderDetails && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {t('checkout.order_details')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('checkout.order_number')}
                    </p>
                    <p className="font-medium">#{orderDetails.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('checkout.date')}
                    </p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('checkout.total')}
                    </p>
                    <p className="font-medium">{orderDetails.total.toFixed(2)} TND</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                  <h4 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                    {t('checkout.whats_next')}
                  </h4>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 text-left">
                    <p className="flex items-start">
                      <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">
                        <CheckCircleIcon className="h-5 w-5" />
                      </span>
                      {t('checkout.order_processing')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors flex-1 sm:flex-none"
              >
                {t('checkout.continue_shopping')}
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('checkout.need_help')} <a href="/contact" className="text-accent hover:underline">{t('checkout.contact_support')}</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-accent mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          {t('checkout.back_to_cart')}
        </button>

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t('checkout.title')}</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Billing Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">{t('checkout.billing_details')}</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('checkout.form.first_name')} <span className="text-red-500">*</span>
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
                      {t('checkout.form.last_name')} <span className="text-red-500">*</span>
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
                    {t('checkout.form.email')} <span className="text-gray-400">{t('checkout.form.email_optional')}</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email || currentUser.email || ''}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700"
                    placeholder={t('checkout.form.email_placeholder')}
                  />
                  <p className="mt-1 text-xs text-gray-500">{t('checkout.form.email_help')}</p>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('checkout.form.phone')} <span className="text-red-500">*</span>
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
                    {t('checkout.form.address')} <span className="text-red-500">*</span>
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

                <div className="mb-4">
                  <label htmlFor="governorate" className="block text-sm font-medium text-gray-700">
                    {t('checkout.form.governorate')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="governorate"
                    name="governorate"
                    value={formData.governorate}
                    onChange={handleGovernorateChange}
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                  >
                    <option value="">{t('checkout.form.select_governorate')}</option>
                    {governorates.map((gov) => (
                      <option key={gov} value={gov}>
                        {gov}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label htmlFor="delegation" className="block text-sm font-medium text-gray-700">
                    {t('checkout.form.delegation')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="delegation"
                    name="delegation"
                    value={formData.delegation}
                    onChange={handleDelegationChange}
                    required
                    disabled={!formData.governorate || delegations.length === 0}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">{t('checkout.form.select_delegation')}</option>
                    {delegations.map((del, index) => (
                      <option key={`${del.delegation}-${index}`} value={del.delegation}>
                        {del.name}
                      </option>
                    ))}
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
                    {t('checkout.form.save_info')}
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <OrderSummary
              cartItems={cartItems}
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={handleSubmit as any}
            />
          </div>

          {/* Confirmation Button */}
          <div className="lg:col-span-3 mt-6">
            <button
              type="submit"
              disabled={isSubmitting || !(
                formData.firstName &&
                formData.phone &&
                formData.address &&
                formData.governorate &&
                formData.delegation
              )}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
                (!formData.firstName || !formData.phone || !formData.address || !formData.governorate || !formData.delegation || isSubmitting)
                  ? 'bg-gray-300 cursor-not-allowed dark:bg-gray-700'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {t('checkout.processing')}
                </span>
              ) : t('checkout.confirm_order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;