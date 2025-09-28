import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../../lib/utils';

interface CouponToggleProps {
  coupon: {
    id: string;
    code: string;
    remaining_amount: number;
  };
  isChecked: boolean;
  onToggle: (checked: boolean) => void;
  className?: string;
}

export const CouponToggle = ({
  coupon,
  isChecked,
  onToggle,
  className = ''
}: CouponToggleProps) => {
  const { t } = useTranslation();
  const [isMounted, setIsMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 h-6 w-48 rounded ${className}`} />
    );
  }

  return (
    <div className={`flex items-center ${className}`}>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onToggle(e.target.checked)}
          className="sr-only peer"
          aria-label={t('checkout.toggle_coupon', { code: coupon.code })}
          aria-checked={isChecked}
          role="switch"
        />
        <div className={`w-14 h-8 ${isChecked ? 'bg-blue-600' : 'bg-gray-300'} peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500/30 rounded-full transition-colors duration-200 ease-in-out`}>
          <div 
            className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transform transition-all duration-200 ease-in-out ${
              isChecked ? 'translate-x-6' : 'translate-x-1'
            }`}
            aria-hidden="true"
          />
        </div>
        <span className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-300">
          {t('checkout.use_coupon', { 
            code: coupon.code, 
            amount: formatPrice(coupon.remaining_amount) 
          })}
        </span>
      </label>
    </div>
  );
};

export default CouponToggle;
