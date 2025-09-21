import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';

export default function ThankYou() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Redirect to home if user navigates directly to this page without completing checkout
  useEffect(() => {
    // You might want to add additional checks here, like checking for a recent order
    // in localStorage or context to ensure the user actually completed a purchase
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-12 sm:px-12 text-center">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100">
            <CheckCircleIcon className="h-12 w-12 text-green-600" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('thankYou.title', 'Thank you for your order!')}
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            {t('thankYou.message', 'Your order has been received and is being processed. You will receive a confirmation email with your order details shortly.')}
          </p>
          
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={() => navigate('/account/orders')}
              className="w-full sm:w-auto px-6 py-3 text-base font-medium"
            >
              {t('thankYou.viewOrders', 'View My Orders')}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="w-full sm:w-auto px-6 py-3 text-base font-medium"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2 -ml-1" />
              {t('thankYou.continueShopping', 'Continue Shopping')}
            </Button>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {t('thankYou.needHelp', 'Need help with your order?')}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {t('thankYou.contactSupport', 'Contact our customer service team on ')}
              <a 
                href="https://wa.me/21655171771" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-indigo-600 hover:text-indigo-500"
              >
                WhatsApp
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
