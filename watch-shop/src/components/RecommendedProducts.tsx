import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types/product';
import ProductCard from './ProductCard';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface RecommendedProductsProps {
  products: Product[];
  currentProductId: string;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  products,
  currentProductId,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  // Filter out the current product and limit to 4 items
  const recommendedProducts = products
    .filter((product) => product.id !== currentProductId)
    .slice(0, 4);

  const handleProductClick = (productId: string) => {
    setLoadingProductId(productId);
    
    // Small delay to show the loading state
    setTimeout(() => {
      // Navigate first
      navigate(`/product/${productId}`);
      
      // Then scroll to top on the new page
      window.scrollTo({
        top: 0,
        behavior: 'auto' // Use 'auto' for immediate scroll to avoid issues during navigation
      });
      
      // Reset loading state after navigation
      setTimeout(() => {
        setLoadingProductId(null);
      }, 100);
    }, 300);
  };

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16 relative">
      <h2 className="text-2xl font-bold mb-6">{t('product.recommended')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendedProducts.map((product) => (
          <motion.div 
            key={product.id}
            initial={{ opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="relative"
          >
            <div 
              onClick={() => handleProductClick(product.id)}
              className="cursor-pointer hover:opacity-90 transition-opacity relative"
            >
              <AnimatePresence>
                {loadingProductId === product.id && (
                  <motion.div 
                    className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 rounded-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  </motion.div>
                )}
              </AnimatePresence>
              <ProductCard
                product={product}
                onAddToCart={(e) => {
                  e.stopPropagation();
                }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default RecommendedProducts;