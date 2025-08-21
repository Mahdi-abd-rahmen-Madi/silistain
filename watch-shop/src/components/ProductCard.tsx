import React, { useRef, useState } from 'react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star, Check } from 'lucide-react';
import { QuickView } from './QuickView';
import { useToast } from '../hooks/use-toast';

import { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const { toast } = useToast();
  
  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Add to cart
    onAddToCart({ ...product, quantity: 1 });
    
    // Show confirmation state
    setIsAddedToCart(true);
    
    // Show toast
    toast({
      title: 'Added to cart',
      description: `"${product.name}" has been added to your cart.`,
    });
    
    // Reset confirmation after delay
    setTimeout(() => {
      setIsAddedToCart(false);
    }, 2000);
  };



  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    toast({
      title: !isWishlisted ? 'Added to wishlist' : 'Removed from wishlist',
      description: !isWishlisted 
        ? `${product.brand} ${product.name} has been added to your wishlist.`
        : `${product.brand} ${product.name} has been removed from your wishlist.`,
    });
  };

  // Check if product is featured
  const isFeatured = product.isFeatured || product.featured;
  
  return (
    <motion.div
      className={`group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${
        isFeatured ? 'ring-2 ring-gold-500' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
    >
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-3 left-3 z-10">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-yellow-400 to-amber-500 text-white shadow-lg">
            <svg className="-ml-0.5 mr-1.5 h-2 w-2 text-white" fill="currentColor" viewBox="0 0 8 8">
              <circle cx={4} cy={4} r={3} />
            </svg>
            Featured
          </span>
        </div>
      )}
      {/* Product Image with Overlay Actions */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50">
        <img
          src={product.images?.[0]?.url || product.imageUrl || '/placeholder-watch.jpg'}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges - Always visible */}
        <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
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
              New Arrival
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
                BEST SELLER
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
                FEATURED
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
            <button
              onClick={toggleWishlist}
              className={`group relative rounded-full p-2.5 bg-white shadow-md transition-all duration-300 ${
                isWishlisted 
                  ? 'text-red-500 hover:bg-red-50 hover:shadow-lg hover:scale-110' 
                  : 'text-gray-700 hover:bg-gray-50 hover:shadow-lg hover:scale-110'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart 
                className={`h-5 w-5 transition-transform duration-300 group-hover:scale-125 ${
                  isWishlisted ? 'fill-current' : ''
                }`} 
                strokeWidth={isWishlisted ? 0 : 1.5} 
              />
            </button>
            
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
        <div className="flex justify-between items-start">
          <div className={`${isFeatured ? 'pr-2' : ''}`}>
            <h3 className={`text-sm font-medium text-gray-900 line-clamp-2 ${
              isFeatured ? 'font-semibold' : ''
            }`}>
              {product.name}
            </h3>
          </div>
          <div className="text-right">
            {product.price && product.price > 0 ? (
              product.discount && product.discount > 0 ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    ${(product.price * (1 - product.discount / 100)).toFixed(2).replace(/\.?0+$/, '').replace(/0+(?=[1-9])/g, '')}
                  </p>
                  <p className="text-xs text-gray-500 line-through">
                    ${product.price.toFixed(2).replace(/\.?0+$/, '').replace(/0+(?=[1-9])/g, '')}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-gray-900">
                  ${product.price.toString().replace(/\.?0+$/, '').replace(/0+(?=[1-9])/g, '')}
                </p>
              )
            ) : (
              <p className="text-sm font-medium text-gray-500">Contact for Price</p>
            )}
          </div>
        </div>

      </div>
      

    </motion.div>
  );
}

export default ProductCard;
