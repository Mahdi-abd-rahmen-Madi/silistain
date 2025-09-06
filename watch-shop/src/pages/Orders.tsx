import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { format } from 'date-fns';
import { ArrowLeft, ShoppingBag, Clock, Truck, PackageCheck, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  brand?: string;
}

interface Order {
  id: string;
  order_number: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  created_at: string;
  items: OrderItem[];
  shipping_address: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    governorate: string;
    zipCode: string;
  };
}

const statusIcons = {
  pending: <Clock className="h-4 w-4 text-amber-500" />,
  processing: <Clock className="h-4 w-4 text-blue-500" />,
  shipped: <Truck className="h-4 w-4 text-indigo-500" />,
  delivered: <PackageCheck className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Orders() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          if (isMounted) {
            setError(t('profile.not_signed_in'));
            setOrders([]);
          }
          return;
        }

        // FIX: Only fetch orders for the current user (NOT guest orders)
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        if (isMounted) {
          // No need to calculate total - it's already stored correctly
          setOrders(data || []);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        if (isMounted) {
          setError(t('orders.loading.error'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchOrders();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status: string) => (
    <Badge className={`${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'} text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1`}>
      {statusIcons[status as keyof typeof statusIcons]}
      {t(`orders.status.${status}`, { defaultValue: status.charAt(0).toUpperCase() + status.slice(1) })}
    </Badge>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent" aria-hidden="true"></div>
            <span className="sr-only">{t('common.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-6 -ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back')}
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">{t('orders.title')}</h1>
        </div>

        {error ? (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">{t('orders.empty.title')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('orders.empty.message')}</p>
            <div className="mt-6">
              <Button onClick={() => navigate('/')}>{t('orders.empty.continue_shopping')}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 px-6 py-4 border-b">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-4">
                        <h2 className="text-lg font-medium">{t('orders.order_number', { number: order.order_number || order.id.substring(0, 8) })}</h2>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {t('orders.placed_on', { date: format(new Date(order.created_at), 'MMMM d, yyyy') })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{t('orders.total_amount')}</p>
                      <p className="text-lg font-medium">{order.total.toFixed(2)} TND</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">{t('orders.items')}</h3>
                      <div className="space-y-4">
                        {order.items.slice(0, 3).map((item) => (
                          <div key={`${item.id}-${item.name}`} className="flex items-start">
                            <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-full w-full object-cover object-center"
                                />
                              ) : (
                                <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                                  <ShoppingBag className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4 flex-1">
                              <div className="flex justify-between text-base font-medium text-gray-900">
                                <h3>{item.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {item.price.toFixed(2)} TND
                                  {item.quantity > 1 && (
                                    <span className="text-xs text-gray-400 ml-1">× {item.quantity} = {(item.price * item.quantity).toFixed(2)} TND</span>
                                  )}
                                </p>
                              </div>
                              <p className="mt-1 text-sm text-gray-500">{t('orders.quantity', { count: item.quantity })}</p>
                              {item.brand && (
                                <p className="mt-1 text-xs text-gray-500">{item.brand}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-gray-500">{t('orders.more_items', { count: order.items.length - 3 })}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-2">{t('orders.shipping_address')}</h3>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-900">
                          {order.shipping_address.firstName} {order.shipping_address.lastName}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {order.shipping_address.address}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.shipping_address.city}, {order.shipping_address.governorate}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.shipping_address.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}