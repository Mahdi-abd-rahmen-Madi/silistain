import React from 'react';
import { Product } from '../types/product';
import ProductCard from './ProductCard';
import { useTranslation } from 'react-i18next';

interface RecommendedProductsProps {
  products: Product[];
  currentProductId: string;
}

const RecommendedProducts: React.FC<RecommendedProductsProps> = ({
  products,
  currentProductId,
}) => {
  const { t } = useTranslation();

  // Filter out the current product and limit to 4 items
  const recommendedProducts = products
    .filter((product) => product.id !== currentProductId)
    .slice(0, 4);

  if (recommendedProducts.length === 0) {
    return null;
  }

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-bold mb-6">{t('product.recommended')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {recommendedProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={() => {}}
          />
        ))}
      </div>
    </section>
  );
};

export default RecommendedProducts;
