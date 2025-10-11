import React, { useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Check } from 'lucide-react';
import { QuickView } from './QuickView';
import { useToast } from '../hooks/use-toast';
import FavoriteButton from './FavoriteButton';
import { Product } from '../types/product';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  
  // Debug log to check the product data
  console.log('Product data:', {
    id: product.id,
    name: product.name,
    offPercentage: product.offPercentage,
    price: product.price
  });

  // Use the product's offPercentage if available, otherwise no discount
  const discountPercentage = product.offPercentage || 0;
  
  // Calculate original price based on discount
  const originalPrice = useMemo(() => {
    if (!product.price || discountPercentage <= 0) return 0;
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price);
    return Math.round(price / (1 - (discountPercentage / 100)));
  }, [product.price, discountPercentage]);
  
  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-TN', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };
  
  // Improved brand detection logic
  const getBrandDisplay = () => {
    if (!product.brand) return t('shop.product.unknown_brand');
    
    const normalized = product.brand.trim().toLowerCase();
    if (
      normalized === '' || 
      normalized === 'unknown brand' || 
      normalized === 'product.unknown_brand'
    ) {
      return t('shop.product.unknown_brand');
    }
    
    return product.brand;
  };

  const handleProductClick = () => {
    navigate(`/product/${product.id}`);
  };
  
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add to cart
    onAddToCart({ ...product, quantity: 1 });
    
    // Show confirmation state
    setIsAddedToCart(true);
    
    // Show toast
    toast({
      title: t('shop.product.added_to_cart', { productName: product.name }),
      description: t('shop.product.added_to_cart_description', { productName: product.name }),
    });
    
    // Reset confirmation after delay
    setTimeout(() => {
      setIsAddedToCart(false);
    }, 2000);
  };

  // Check if product is featured
  const isFeatured = product.isFeatured || product.featured;
  
  return (
    <motion.div
      className="relative bg-white rounded-xl shadow-sm overflow-hidden group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleProductClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg">
            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
              <circle cx={4} cy={4} r={3} />
            </svg>
            {t('shop.featured_product')}
          </span>
        </div>
      )}
      {/* Product Image with Overlay Actions */}
      <div 
        className="relative aspect-square overflow-hidden rounded-lg bg-gray-50"
        onContextMenu={(e) => e.preventDefault()}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          position: 'relative'
        }}
      >
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(to bottom, transparent 0%, transparent 5%, rgba(0,0,0,0.05) 15%, transparent 25%, transparent 75%, rgba(0,0,0,0.05) 85%, transparent 95%, transparent 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />
        <img
          src={product.images?.[0]?.url || product.imageUrl || '/placeholder-watch.jpg'}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105 select-none"
          draggable="false"
          onDragStart={(e) => e.preventDefault()}
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserDrag: 'none',
            KhtmlUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
            userSelect: 'none',
            pointerEvents: 'none'
          } as React.CSSProperties & {
            WebkitTouchCallout: string;
            WebkitUserDrag: string;
            KhtmlUserSelect: string;
            MozUserSelect: string;
            msUserSelect: string;
          }}
        />
        
        {/* Badges - Always visible */}
        <div 
          className="absolute left-3 top-3 z-10 flex flex-col space-y-2"
          style={{ pointerEvents: 'none' }}
        >
          {/* Show New Arrival badge if product is new, otherwise show Best Seller if applicable */}
          {product.isNew ? (
            <motion.span 
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-blue-400 px-3 py-1 text-xs font-semibold text-white shadow-lg border border-white/20"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: { 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 20 
                }
              }}
            >
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-90"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              {t('shop.new_arrival')}
            </motion.span>
          ) : product.isBestSeller ? (
            <motion.span 
              className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-yellow-700 via-yellow-800 to-yellow-900 px-3 py-1 text-xs font-bold shadow-xl border border-amber-400/40 backdrop-blur-sm"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [1, 1.03, 1],
                opacity: 1,
                boxShadow: [
                  '0 0 0 0 rgba(234, 179, 8, 0.6)',
                  '0 0 0 4px rgba(234, 179, 8, 0.3)',
                  '0 0 0 0 rgba(234, 179, 8, 0)'
                ],
                transition: { 
                  scale: { repeat: Infinity, duration: 2.2, ease: 'easeInOut' },
                  opacity: { duration: 0.3 },
                  boxShadow: { repeat: Infinity, duration: 3, ease: 'easeInOut' }
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1.5 text-yellow-300 drop-shadow-sm" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="bg-gradient-to-r from-yellow-100 to-yellow-300 bg-clip-text text-transparent font-extrabold drop-shadow-sm">
                {t('shop.best_seller')}
              </span>
            </motion.span>
          ) : null}
          
          {/* Featured badge - shown only if featured and not new */}
          {product.featured && !product.isNew && (
            <motion.span 
              className="relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-purple-800 via-purple-700 to-fuchsia-800 px-3 py-1 text-xs font-bold shadow-xl border-2 border-purple-300/40 backdrop-blur-sm overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                boxShadow: [
                  '0 0 0 0 rgba(216, 180, 254, 0.5)',
                  '0 0 0 4px rgba(216, 180, 254, 0.3)',
                  '0 0 0 8px rgba(216, 180, 254, 0.1)',
                  '0 0 0 0 rgba(216, 180, 254, 0)'
                ],
                transition: { 
                  type: 'spring', 
                  stiffness: 300, 
                  damping: 20,
                  boxShadow: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' }
                }
              }}
            >
              {/* Background shine effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-purple-200/10 to-fuchsia-500/10"></span>
              
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="relative h-3.5 w-3.5 mr-1.5 text-purple-100 drop-shadow-sm" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="relative bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent font-extrabold drop-shadow-[0_1px_1px_rgba(0,0,0,0.4)]">
                {t('shop.featured_product')}
              </span>
            </motion.span>
          )}
        </div>

        {/* Wishlist and Cart Buttons - Always visible but more prominent on hover */}
        <div className={`absolute inset-0 rounded-lg transition-all duration-300 ${
        isFeatured 
          ? 'bg-gradient-to-br from-amber-50/30 to-transparent group-hover:from-amber-50/50' 
          : 'bg-black bg-opacity-0 group-hover:bg-opacity-10'
      }`}>
          <div className={`absolute right-3 top-3 z-10 flex flex-col space-y-2 transition-all duration-300 ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}>
            <FavoriteButton 
              productId={product.id}
              productData={product}
              size="sm"
              variant="ghost"
              onToggle={(isFavorited) => {
                toast({
                  title: isFavorited 
                    ? t('shop.product.added_to_favorites', { brand: product.brand, name: product.name })
                    : t('shop.product.removed_from_favorites', { brand: product.brand, name: product.name }),
                  description: isFavorited
                    ? t('shop.product.added_to_favorites_description', { brand: product.brand, name: product.name })
                    : t('shop.product.removed_from_favorites_description', { brand: product.brand, name: product.name }),
                });
              }}
              className="bg-white shadow-md hover:shadow-lg"
            />
            
            <motion.button
              ref={cartButtonRef}
              onClick={handleAddToCartClick}
              className={`group relative rounded-full p-2.5 shadow-md transition-all duration-300 ${
                isAddedToCart 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 hover:scale-110'
              }`}
              aria-label="Add to cart"
              whileTap={{ scale: 0.95 }}
            >
              {isAddedToCart ? (
                <Check className="h-5 w-5" />
              ) : (
                <ShoppingCart className="h-5 w-5 transition-transform duration-300 group-hover:scale-125" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Product Info - Always visible */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-3">
          {product.name}
        </h3>
        <div className="w-full">
          {product.price && product.price > 0 ? (
            <div>
              {/* Price and Discount Badge */}
              <div className="flex items-center justify-between mb-1">
                <div className="text-[22px] font-bold text-gray-900">
                  {formatPrice(Number(product.price))} TND
                </div>
                {discountPercentage > 0 && (
                  <div className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    -{discountPercentage}%
                  </div>
                )}
              </div>
              
              {/* Original Price and Save Amount */}
              <div className="flex items-center gap-2">
                {discountPercentage > 0 && originalPrice > 0 && (
                  <>
                    <span className="text-xs text-gray-500 line-through">
                      {formatPrice(originalPrice)} TND
                    </span>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
                      Save {formatPrice(originalPrice - Number(product.price))} TND
                    </span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium text-gray-500">Contact for Price</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ProductCard;