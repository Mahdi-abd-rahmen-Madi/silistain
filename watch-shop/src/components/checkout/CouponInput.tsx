import { useState } from 'react';
import { validateCoupon } from '../../services/couponService';
import { useAuth } from '../../context/AuthContext';

interface CouponInputProps {
  onApplyCoupon: (coupon: any) => void;
  disabled?: boolean;
}

export const CouponInput = ({ onApplyCoupon, disabled }: CouponInputProps) => {
  const { currentUser } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    if (!currentUser?.id) {
      setError('You need to be logged in to use a coupon');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const { valid, coupon, error: validationError } = await validateCoupon(couponCode, currentUser.id);
      
      if (!valid || !coupon) {
        setError(validationError || 'Invalid coupon code');
        return;
      }

      onApplyCoupon(coupon);
      setSuccess('Coupon applied successfully!');
      setCouponCode('');
    } catch (err) {
      console.error('Error applying coupon:', err);
      setError('Failed to apply coupon. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-4">
      <label htmlFor="coupon-code" className="block text-sm font-medium text-gray-700">
        Coupon Code
      </label>
      <div className="mt-1 flex rounded-md shadow-sm">
        <div className="relative flex-grow focus-within:z-10">
          <input
            type="text"
            name="coupon-code"
            id="coupon-code"
            className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md pl-3 sm:text-sm border-gray-300"
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={disabled || isLoading}
          />
        </div>
        <button
          type="button"
          onClick={handleApplyCoupon}
          disabled={disabled || isLoading || !couponCode.trim()}
          className={`-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-r-md ${
            disabled || isLoading || !couponCode.trim()
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Applying...
            </>
          ) : (
            'Apply'
          )}
        </button>
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {success && (
        <p className="mt-1 text-sm text-green-600">{success}</p>
      )}
    </div>
  );
};

export default CouponInput;
