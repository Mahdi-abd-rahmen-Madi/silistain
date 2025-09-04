import { useState, useEffect, ChangeEvent, FormEvent, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { submitOrderToSheets, formatOrderData } from '../utils/api';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { CheckoutFormData, OrderDetails } from '../types';
import { OrderSummary } from '../components/OrderSummary';
import { CartItem } from '../context/CartContext';
import { fetchMunicipalities, getGovernorates, getDelegations, getCities } from '../services/locationService';
import type { Municipality } from '../types/order';
import { useTranslation } from 'react-i18next';


// Form field types
interface FormFields {
  firstName: string;
  lastName?: string | undefined; // Made optional with explicit undefined
  email?: string;
  phone: string;
  address: string;
  governorate: string;
  delegation: string;
  zipCode: string;
  saveInfo: boolean;
  [key: string]: string | boolean | undefined; // Supports optional fields
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

  // Fetch all municipalities on component mount
  const loadMunicipalities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchMunicipalities();
      setMunicipalities(data);
    } catch (err) {
      console.error('Error fetching municipalities:', err);
      setError('Failed to load location data. Please try again later.');
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
          setError('Failed to load delegations. Please try again.');
        });
    } else {
      setDelegations([]);
    }
  };

  // Handle delegation change
  const handleDelegationChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const selectedDelegation = delegations.find((d: Delegation) => d.delegation === value);

    setFormData(prev => ({
      ...prev,
      delegation: value
    }));

    // City loading removed as city field is no longer used
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

    try {
      // Calculate total
      const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0) * 1.1 + 29.99;
      
      // Ensure cart items have required brand property
      const itemsWithBrand = cartItems.map(item => ({
        ...item,
        brand: item.brand || t('product.unknown_brand') // Provide a default brand if missing
      }));
      
      // Format the order data with all required fields
      const orderFormData: CheckoutFormData = {
        ...formData,
        cardNumber: '', // Not used for cash on delivery
        cardName: '',   // Not used for cash on delivery
        expiryDate: '',  // Not used for cash on delivery
        cvv: '',        // Not used for cash on delivery
        shippingSameAsBilling: true, // Default to true for simplicity
        total: total.toString(),
        customerName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email as string
      };
      
      const orderData = formatOrderData(orderFormData, itemsWithBrand);

      // Submit the order
      const response = await submitOrderToSheets(orderData, t); // Pass the translation function to submitOrderToSheets
      
      // Handle success - create proper OrderDetails object
      const orderDetails: OrderDetails = {
        orderId: response?.orderId || `order_${Date.now()}`,
        customerName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email as string,
        total: total,
        items: cartItems.map(item => ({
          id: Number(item.id) || 0,
          name: item.name || 'Product',
          quantity: item.quantity,
          price: item.price
        }))
      };
      setOrderDetails(orderDetails);
      setIsSuccess(true);
      clearCart();
      
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                    <p className="font-medium">${orderDetails.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {t('checkout.payment_method_label')}
                    </p>
                    <p className="font-medium">{t('checkout.cash_on_delivery')}</p>
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
              <button
                onClick={() => navigate('/account/orders')}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex-1 sm:flex-none"
              >
                {t('checkout.track_order')}
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
                    value={formData.email || ''}
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

            {/* Payment Method */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-medium text-gray-900 dark:text-white">{t('checkout.payment_method')}</h2>
              </div>
              <div className="p-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h2a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium">{t('checkout.payment_info.cash_on_delivery_title')}</h3>
                      <div className="mt-2 text-sm">
                        <p>{t('checkout.payment_info.cash_on_delivery_help')}</p>
                      </div>
                    </div>
                  </div>
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
              {isSubmitting ? t('checkout.processing') : t('checkout.confirm_order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
