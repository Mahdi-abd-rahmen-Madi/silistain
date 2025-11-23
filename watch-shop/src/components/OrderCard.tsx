import { format } from 'date-fns';
import { Package, Clock, CheckCircle, XCircle, AlertCircle, Truck, PackageCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Order } from '../context/OrdersContext';
import { useState, useMemo } from 'react';
import { ProductImage } from '../types/product';
import { useTranslation } from 'react-i18next';
import { formatPrice } from '../lib/utils';
import { CachedImage } from './ui/CachedImage';

interface OrderCardProps {
  order: Order;
}

const statusIcons = {
  pending: <Clock className="w-4 h-4 text-amber-500" />,
  processing: <Clock className="w-4 h-4 text-blue-500" />,
  shipped: <Truck className="w-4 h-4 text-indigo-500" />,
  delivered: <PackageCheck className="w-4 h-4 text-green-500" />,
  cancelled: <XCircle className="w-4 h-4 text-red-500" />,
};

const statusColors = {
  pending: 'bg-amber-100 text-amber-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const paymentStatusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-blue-100 text-blue-800',
  failed: 'bg-red-100 text-red-800',
};

export function OrderCard({ order }: OrderCardProps) {
  const { t } = useTranslation();
  const formattedDate = format(new Date(order.created_at), t('date.formats.default', { defaultValue: 'MMM d, yyyy' }));
  const status = (order.status || '').toLowerCase();
  const paymentStatus = (order.payment_status || 'pending').toLowerCase();
  
  // Get localized status text
  const getStatusText = (status: string) => {
    return t(`orders.status.${status}`, { 
      defaultValue: status.charAt(0).toUpperCase() + status.slice(1) 
    });
  };
  
  // Get localized payment status text
  const getPaymentStatusText = (status: string) => {
    if (status === 'paid') return t('orders.payment_status.paid');
    if (status === 'refunded') return t('orders.payment_status.refunded');
    if (status === 'failed') return t('orders.payment_status.failed');
    return t('orders.payment_status.pending');
  };
  
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow transition-shadow duration-200">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-gray-500">{t('orders.order_number', { 
              number: order.order_number || order.id.split('-')[0].toUpperCase() 
            })}</p>
            <p className="text-xs text-gray-400">{formattedDate}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'} flex items-center gap-1`}>
              {statusIcons[status as keyof typeof statusIcons] || <Package className="w-3 h-3" />}
              {getStatusText(status)}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full ${paymentStatusColors[paymentStatus as keyof typeof paymentStatusColors] || 'bg-gray-100 text-gray-800'}`}>
              {getPaymentStatusText(paymentStatus)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <div className="space-y-4">
          {order.items?.slice(0, 3).map((item, index) => (
            <div key={item.id || `item-${index}`} className="flex items-center gap-4">
              <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative">
                {(() => {
                  // Function to get image URL from various possible sources
                  const getImageUrl = (): string => {
                    // 1. Check direct image property first
                    if (item.image) return item.image;
                    
                    // 2. Check product.images array if available
                    if (item.product?.images) {
                      // Handle array of images
                      if (Array.isArray(item.product.images) && item.product.images.length > 0) {
                        const firstImage = item.product.images[0];
                        if (typeof firstImage === 'string') return firstImage;
                        if (firstImage && typeof firstImage === 'object' && 'url' in firstImage) {
                          return firstImage.url;
                        }
                      }
                      // Handle single image object
                      else if (item.product.images && typeof item.product.images === 'object' && 'url' in item.product.images) {
                        const imageObj = item.product.images as { url: string };
                        return imageObj.url;
                      }
                    }
                    
                    // 3. Check product.imageUrl as fallback
                    if (item.product?.imageUrl) return item.product.imageUrl;
                    
                    // 4. Return default placeholder
                    return '/placeholder-watch.jpg';
                  };
                  
                  const imageUrl = getImageUrl();
                  
                  return (
                    <CachedImage 
                      src={imageUrl}
                      alt={item.name || 'Product image'}
                      className="w-full h-full object-cover"
                    />
                  );
                })()}
                
                {!item.image && !item.product?.imageUrl && !(
                  Array.isArray(item.product?.images) ? item.product.images.length > 0 : false
                ) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                    <Package className="w-5 h-5 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate" title={item.name || 'Product'}>
                {item.name || 'Product'}
              </h4>
                {item.brand && <p className="text-xs text-gray-500">{item.brand}</p>}
                <p className="text-gray-500">{formatPrice(item.price * item.quantity)}</p>
                <p className="text-sm font-medium text-gray-900">
                  {formatPrice(item.price)}
                  {item.quantity > 1 && ` × ${item.quantity} = ${formatPrice(item.price * item.quantity)}`}
                </p>
              </div>
            </div>
          ))}
          
          {order.items && order.items.length > 3 && (
            <p className="text-sm text-gray-500 text-center">+{order.items.length - 3} more items</p>
          )}
          
          <div className="pt-4 border-t">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{formatPrice(order.total)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderCard;
