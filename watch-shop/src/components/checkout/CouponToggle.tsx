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
        />
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
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
