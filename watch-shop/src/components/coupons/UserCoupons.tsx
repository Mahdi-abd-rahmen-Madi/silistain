import { useEffect, useState } from 'react';
import { getAvailableCoupons, getCouponHistory } from '../../services/couponService';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

export const UserCoupons = () => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCoupons = async () => {
      if (!currentUser?.id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        const data = activeTab === 'available'
          ? await getAvailableCoupons(currentUser.id)
          : await getCouponHistory(currentUser.id);
          
        setCoupons(data);
      } catch (err) {
        console.error('Error loading coupons:', err);
        setError('Failed to load coupons. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadCoupons();
  }, [activeTab, currentUser?.id]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">My Coupons</h2>
        
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`${
                activeTab === 'available'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Available Coupons
              <span className="ml-2 bg-indigo-100 text-indigo-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {coupons.filter(c => !c.is_used && new Date(c.expires_at) > new Date()).length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`${
                activeTab === 'history'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              History
            </button>
          </nav>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {coupons.length === 0 ? (
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No {activeTab === 'available' ? 'available' : ''} coupons</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'available'
                ? "You don't have any available coupons at the moment."
                : 'Your coupon history will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {coupons.map((coupon) => (
              <div
                key={coupon.id}
                className={`border rounded-lg p-4 ${coupon.is_used ? 'bg-gray-50' : 'bg-white border-indigo-200'}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900">
                        {coupon.code}
                      </span>
                      {!coupon.is_used && new Date(coupon.expires_at) > new Date() && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      )}
                      {coupon.is_used && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Used
                        </span>
                      )}
                      {!coupon.is_used && new Date(coupon.expires_at) < new Date() && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Expired
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-500">
                      {coupon.is_used
                        ? `Used on ${formatDate(coupon.used_at)}`
                        : `Expires on ${formatDate(coupon.expires_at)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-indigo-600">
                      {coupon.remaining_amount.toFixed(2)} TND
                    </p>
                    {!coupon.is_used && coupon.remaining_amount < coupon.amount && (
                      <p className="text-xs text-gray-500 line-through">
                        Original: {coupon.amount.toFixed(2)} TND
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserCoupons;
