import { useState, useEffect, useMemo, ChangeEvent, FormEvent, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { submitOrderToSheets, formatOrderData } from '../utils/api';
import { createOrderInDatabase } from '../services/orderService';
import { supabase } from '../lib/supabaseClient';
import { ArrowLeftIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { OrderSummary } from '../components/OrderSummary';
import { fetchMunicipalities, getGovernorates, getDelegations } from '../services/locationService';
import type { Municipality } from '../types/order';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { CouponInput } from '../components/checkout/CouponInput';
import { CouponToggle } from '../components/checkout/CouponToggle';
import { applyCoupon, Coupon, generateCouponCode, calculateCouponValue } from '../services/couponService';
import { formatPrice } from '../lib/utils';
import { CouponRewardModal } from '../components/checkout/CouponRewardModal';
import { saveCoupon } from '../services/api/couponApi';

import { CheckoutFormData } from '../types/checkout';
import { CartItem } from '../types/cart';

// Add this interface to fix the "Cannot find name 'OrderDetails'" error
// Changed id from number to string to match cart item id type
interface OrderDetails {
  orderId: string;
  customerName: string;
  email?: string; // Made optional since we're removing the email field
  total: number;
  items: {
    id: string; // Changed from number to string
    name: string;
    quantity: number;
    price: number;
  }[];
}

// Form field types
interface FormFields {
  name: string;
  phone: string;
  address: string;
  governorate: string;
  delegation: string;
  saveInfo: boolean;
  [key: string]: string | boolean | undefined;
};

interface Delegation {
  name: string;
  delegation: string;
  governorate: string;
}

type LocalMunicipality = Omit<Municipality, 'id' | 'created_at'>;

interface Governorate {
  governorate: string;
  // Add other properties if they exist
}

interface CheckoutProps {
  embedded?: boolean;
  product?: any; // Replace 'any' with the actual Product type if available
  onOrderSuccess?: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ 
  embedded = false, 
  product,
  onOrderSuccess 
}) => {
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
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [useCoupon, setUseCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [showCouponReward, setShowCouponReward] = useState(false);

  // Form state
  const [formData, setFormData] = useState<FormFields>({
    name: '',
    phone: '',
    address: '',
    governorate: '',
    delegation: '',
    saveInfo: false
  });

  // Update form data when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: currentUser.user_metadata?.full_name || ''
      }));
    }
  }, [currentUser]);

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
  const [governorates, setGovernorates] = useState<string[]>([]);

  useEffect(() => {
    const fetchGovernorates = async () => {
      try {
        const govs = await getGovernorates(municipalities);
        if (!Array.isArray(govs)) return;
        
        // Handle empty array case
        if (govs.length === 0) {
          setGovernorates([]);
          return;
        }
        
        // Handle array of strings
        if (typeof govs[0] === 'string') {
          setGovernorates(govs.filter((g): g is string => typeof g === 'string').sort());
          return;
        }
        
        // Handle array of objects with governorate property
        if (typeof govs[0] === 'object' && govs[0] !== null) {
          const governorateList = govs
            .map((g: any) => (g && typeof g === 'object' && 'governorate' in g) ? g.governorate : null)
            .filter((g): g is string => typeof g === 'string' && g.length > 0)
            .sort();
          setGovernorates(governorateList);
        }
      } catch (error) {
        console.error('Error loading governorates:', error);
        setGovernorates([]);
      }
    };

    fetchGovernorates();
  }, [municipalities]);

  // Handle governorate change
  const handleGovernorateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const gov: string = e.target.value;
    handleGovernorateSelect(gov);
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
  const handleSubmit = async (e?: FormEvent<HTMLFormElement>) => {
    const validateForm = () => {
      const requiredFields: (keyof FormFields)[] = [
        'name', 'phone', 'address', 'governorate', 'delegation'
      ];

      // Check required fields
      for (const field of requiredFields) {
        if (!formData[field]) {
          setError(t(`checkout.error.missing_${field === 'name' ? 'name' : field}`));
          return false;
        }
      }

      return true;
    };

    e?.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate subtotal - sum of all items
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      // Calculate potential discount amount but don't apply yet
      const potentialDiscount = (appliedCoupon && useCoupon) 
        ? Math.min(appliedCoupon.remaining_amount, subtotal) 
        : 0;
      
      // Initialize final discount amount
      let finalDiscount = 0;
      
      // Format cart items with required properties
      const formattedCartItems = cartItems.map(item => ({
        ...item,
        name: item.name || t('product.unknown_product'),
        brand: item.brand || t('product.unknown_brand'),
        // Ensure all required CartItem properties are present
        id: item.id,
        price: item.price,
        quantity: item.quantity,
        image: item.image || ''
      }));
      
      // Prepare order data for database
      const orderFormData = {
        name: formData.name,
        phone: formData.phone,
        address: formData.address,
        governorate: formData.governorate,
        delegation: formData.delegation,
        saveInfo: formData.saveInfo,
        items: formattedCartItems,
        total: subtotal,
        discount: 0, // Will be updated after coupon application
        couponCode: appliedCoupon?.code || undefined
      };

      // Create the order in the database first (without coupon applied)
      const order = await createOrderInDatabase(
        orderFormData,
        orderFormData.items,
        currentUser?.id || null
      );
      
      if (!order) {
        throw new Error('Failed to create order');
      }
      
      // Apply coupon after order is created if applicable
      if (appliedCoupon && useCoupon && potentialDiscount > 0) {
        try {
          const couponResult = await applyCoupon(
            appliedCoupon.id,
            order.id,
            potentialDiscount
          );
          
          if (couponResult.success && couponResult.data) {
            finalDiscount = potentialDiscount;
            
            // Update the order with coupon details using the supabase client
            const { error: updateError } = await supabase
              .from('orders')
              .update({
                discount_amount: finalDiscount,
                total_amount: subtotal - finalDiscount,
                coupon_id: appliedCoupon.id,
                coupon_code: appliedCoupon.code,
                coupon_discount: finalDiscount,
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);
            
            if (updateError) {
              console.error('Error updating order with coupon details:', updateError);
            }
            
            // Update the applied coupon in state
            setAppliedCoupon(prev => ({
              ...prev!,
              remaining_amount: couponResult.data.remaining_balance || 0,
              is_used: couponResult.data.success === true && couponResult.data.remaining_balance <= 0
            }));
          } else if (couponResult.error) {
            console.error('Failed to apply coupon:', couponResult.error);
            // Continue with the order even if coupon application fails
          }
        } catch (err) {
          console.error('Error applying coupon:', err);
          // Continue with the order even if coupon application fails
        }
      }
      
      // Prepare order data for sheets submission
      const finalTotal = subtotal - finalDiscount;
      const itemsWithBrand = formattedCartItems;
      
      // Set order details for success screen
      setOrderDetails({
        orderId: order.id,
        customerName: formData.name.trim(),
        total: finalTotal,
        items: itemsWithBrand.map(item => ({
          id: item.id, // This is now string, matching the interface
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      });
      
      // Clear cart and show success
      clearCart();
      setIsSuccess(true);
    } catch (error) {
      console.error('Error during checkout:', error);
      setError(error instanceof Error ? error.message : t('checkout.error.submission_failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show login/signup suggestion for unauthenticated users
  const authPrompt = !currentUser && (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
      <p className="text-blue-800 dark:text-blue-200">
        {t('checkout.guest_checkout_notice')} 
        <button 
          onClick={() => navigate('/login', { state: { from: '/checkout' } })}
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          {t('auth.sign_in')}
        </button> {t('common.or')}{' '}
        <button 
          onClick={() => navigate('/signup', { state: { from: '/checkout' } })}
          className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
        >
          {t('auth.create_account')}
        </button> {t('checkout.for_faster_checkout')}
      </p>
    </div>
  );

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
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-medium text-black mb-4">
                  {t('checkout.order_details')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div>
                    <p className="text-sm text-gray-600">
                      {t('checkout.order_number')}
                    </p>
                    <p className="font-medium">#{orderDetails.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {t('checkout.date')}
                    </p>
                    <p className="font-medium">{new Date().toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">
                      {t('checkout.total')}
                    </p>
                    <p className="font-medium">{formatPrice(orderDetails.total)}</p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-black mb-3">
                    {t('checkout.whats_next')}
                  </h4>
                  <div className="space-y-3 text-sm text-gray-700 text-left">
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

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                {t('checkout.need_help')} <a href="/contact" className="text-accent hover:underline">{t('checkout.contact_support')}</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-700 hover:text-accent mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          {t('checkout.back_to_cart')}
        </button>

        <h1 className="text-3xl font-bold text-black mb-8">{t('checkout.title')}</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Billing Details */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-medium text-black">{t('checkout.billing_details')}</h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-800 mb-1">
                    {t('checkout.form.name')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

<div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-800 mb-1">
                    {t('checkout.form.phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-800 mb-1">
                    {t('checkout.form.address')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="governorate" className="block text-sm font-medium text-gray-800">
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
              appliedCoupon={appliedCoupon ? { 
                code: appliedCoupon.code, 
                amount: appliedCoupon.remaining_amount 
              } : null}
              onRemoveCoupon={() => setAppliedCoupon(null)}
              isSubmitting={isSubmitting}
              error={error}
              onSubmit={handleSubmit}
            />
            <div className="space-y-4">
              <CouponInput 
                onApplyCoupon={(coupon) => {
                  setAppliedCoupon(coupon);
                  setUseCoupon(true); // Auto-enable the toggle when a new coupon is applied
                  setCouponError(null);
                }} 
                disabled={isSubmitting}
              />
              
              {appliedCoupon && (
                <CouponToggle
                  coupon={{
                    id: appliedCoupon.id,
                    code: appliedCoupon.code,
                    remaining_amount: appliedCoupon.remaining_amount
                  }}
                  isChecked={useCoupon}
                  onToggle={(checked) => {
                    setUseCoupon(checked);
                    if (!checked) {
                      // Show a message when disabling the coupon
                      setCouponError(t('checkout.coupon_disabled'));
                      setTimeout(() => setCouponError(null), 3000); // Clear after 3 seconds
                    }
                  }}
                />
              )}
              
              {couponError && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400">
                  {couponError}
                </p>
              )}
            </div>
          </div>

          {/* Confirmation Button */}
          <div className="lg:col-span-3 mt-6">
            <button
              type="submit"
              disabled={isSubmitting || !(
                formData.name &&
                formData.phone &&
                formData.address &&
                formData.governorate &&
                formData.delegation
              )}
              className={`w-full py-3 px-6 rounded-lg font-medium text-white transition-colors ${
                (!formData.name || !formData.phone || !formData.address || !formData.governorate || !formData.delegation || isSubmitting)
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
      
      {/* Coupon Reward Modal */}
      <CouponRewardModal
        isOpen={showCouponReward}
        onClose={() => {
          setShowCouponReward(false);
          clearCart();
          setIsSuccess(true);
          // Redirect to thank you page after showing the coupon
          setTimeout(() => {
            navigate('/thank-you', { state: { orderDetails } });
          }, 5000);
        }}
        orderTotal={cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)}
        orderId={orderDetails?.orderId || ''}
        customerEmail={typeof formData.email === 'string' ? formData.email : (currentUser?.email || '')}
      />
    </div>
  );
};

export default Checkout;