import React, { useState } from 'react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { QuickView } from './QuickView';
import { useToast } from '../hooks/use-toast';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  discount?: number;
  isNew?: boolean;
  isBestSeller?: boolean;
  quantity?: number;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAddToCart({ ...product, quantity: 1 });
    toast({
      title: 'Added to cart',
      description: `${product.brand} ${product.name} has been added to your cart.`,
    });
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

  return (
    <motion.div 
      className="group relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Product Image with Overlay Actions */}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Badges */}
        <div className="absolute left-3 top-3 z-10 flex flex-col space-y-2">
          {product.discount && (
            <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-1 text-xs font-medium text-white">
              -{product.discount}%
            </span>
          )}
          {product.isNew && (
            <span className="inline-flex items-center justify-center rounded-full bg-blue-500 px-2 py-1 text-xs font-medium text-white">
              New
            </span>
          )}
          {product.isBestSeller && (
            <span className="inline-flex items-center justify-center rounded-full bg-yellow-400 px-2 py-1 text-xs font-medium text-gray-900">
              Best Seller
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={toggleWishlist}
          className={`absolute right-3 top-3 z-10 rounded-full p-2 transition-colors ${
            isWishlisted 
              ? 'bg-red-100 text-red-500 hover:bg-red-200' 
              : 'bg-white/90 text-gray-700 hover:bg-gray-100'
          }`}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart 
            className={`h-5 w-5 ${isWishlisted ? 'fill-current' : ''}`} 
            strokeWidth={isWishlisted ? 0 : 1.5} 
          />
        </button>

        {/* Quick View & Add to Cart Buttons */}
        <div className={`absolute inset-0 flex items-center justify-center space-x-2 bg-black/0 transition-all duration-300 ${
          isHovered ? 'bg-black/30 opacity-100' : 'opacity-0'
        }`}>
          <QuickView product={product} />
          <Button 
            variant="default" 
            size="sm" 
            onClick={handleAddToCart}
            className="flex items-center space-x-1"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Add to Cart</span>
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              {product.brand}
            </h3>
            <p className="mt-1 text-sm text-gray-700">{product.name}</p>
          </div>
          <div className="text-right">
            {product.discount ? (
              <>
                <p className="text-sm font-medium text-gray-900">
                  ${(product.price * (1 - product.discount / 100)).toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 line-through">
                  ${product.price.toFixed(2)}
                </p>
              </>
            ) : (
              <p className="text-sm font-medium text-gray-900">
                ${product.price.toFixed(2)}
              </p>
            )}
          </div>
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="mt-2 flex items-center">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(product.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                  fill="currentColor"
                />
              ))}
            </div>
            {product.reviewCount && (
              <span className="ml-2 text-xs text-gray-500">
                ({product.reviewCount})
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ProductCard;
