import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/Button';
import {
  ShoppingCart,
  Truck,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CreditCard,
  MessageCircle
} from 'lucide-react';
import { Product } from '../types/product';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import FavoriteButton from '../components/FavoriteButton';
import { formatPrice } from '../lib/utils';
import ProductCard from '../components/ProductCard';
import RecommendedProducts from '../components/RecommendedProducts';
import { useTranslation } from 'react-i18next';
import Checkout from './Checkout'; // Adjust path if needed

const ProductDetailsPage: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { products, loading, getProductById } = useProducts();
  const [selectedImage, setSelectedImage] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isCheckoutExpanded, setIsCheckoutExpanded] = useState(false);

  const currentProduct = id ? getProductById(id) : null;

  // Find similar products
  useEffect(() => {
    if (currentProduct && products.length > 0) {
      const priceRange = currentProduct.price * 0.3;
      const minPrice = currentProduct.price - priceRange;
      const maxPrice = currentProduct.price + priceRange;

      const similar = products.filter(
        (product) =>
          product.id !== currentProduct.id &&
          product.category === currentProduct.category &&
          product.price >= minPrice &&
          product.price <= maxPrice
      );

      if (similar.length === 0) {
        const fallbackSimilar = products
          .filter(
            (product) =>
              product.id !== currentProduct.id &&
              product.price >= minPrice &&
              product.price <= maxPrice
          )
          .slice(0, 4);
        setSimilarProducts(fallbackSimilar);
      } else {
        setSimilarProducts(similar.slice(0, 4));
      }
    }
  }, [currentProduct, products]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">{t('product.not_found.title')}</h1>
        <p className="text-gray-600 mt-2">{t('product.not_found.description')}</p>
        <Button onClick={() => navigate('/shop')} className="mt-4">
          {t('product.not_found.back_to_shop')}
        </Button>
      </div>
    );
  }

  const getProductImages = (product: Product) => {
    const images = [];
    for (let i = 1; i <= 10; i++) {
      const imageUrl = product[`image_url_${i}` as keyof Product];
      if (imageUrl && typeof imageUrl === 'string') {
        images.push({ url: imageUrl, isPrimary: i === 1, order: i - 1 });
      }
    }
    if (images.length === 0 && product.imageUrl) {
      images.push({ url: product.imageUrl, isPrimary: true, order: 0 });
    }
    if (images.length === 0) {
      images.push({ url: '/placeholder-watch.jpg', isPrimary: true, order: 0 });
    }
    return images;
  };

  const displayImages = getProductImages(currentProduct);

  const handleWhatsAppClick = () => {
    if (!currentProduct) return;
    
    // Construct WhatsApp message with product details
    const productName = currentProduct.name;
    const productPrice = formatPrice(currentProduct.price);
    const productUrl = window.location.href;
    const message = `Hello! I'm interested in this product:\n\n*${productName}*\nPrice: ${productPrice}\n\nProduct Link: ${productUrl}`;
    
    // Replace with your WhatsApp number
    const phoneNumber = '1234567890'; // TODO: Replace with actual business WhatsApp number
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        {t('common.back')}
      </button>

      {currentProduct && (
        <>
          <div className="mb-12">
            <div className="bg-gray-50 rounded-lg overflow-hidden mb-4">
              <img
                src={displayImages[selectedImage]?.url || '/placeholder-watch.jpg'}
                alt={currentProduct.name}
                className="w-full h-96 object-contain p-8"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {displayImages.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`flex-shrink-0 w-16 h-16 border rounded-md overflow-hidden ${
                    selectedImage === index ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <img
                    src={img.url}
                    alt={`${currentProduct.name} view ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info + Embedded Checkout */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* Product Details */}
            <div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{currentProduct.name}</h1>

                  {/* 🔹 Discount-aware price display */}
                  <div className="mt-2">
                    {currentProduct.original_price != null &&
                    currentProduct.original_price > currentProduct.price ? (
                      <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
                        <p className="text-2xl font-semibold text-primary">
                          {formatPrice(currentProduct.price)}
                        </p>
                        <p className="text-lg text-gray-500 line-through">
                          {formatPrice(currentProduct.original_price)}
                        </p>
                        <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-1 rounded self-start sm:self-center">
                          {currentProduct.offPercentage || 
                            Math.round(
                              ((currentProduct.original_price - currentProduct.price) / currentProduct.original_price) * 100
                            )}% OFF
                        </span>
                      </div>
                    ) : (
                      <p className="text-2xl font-semibold text-primary">
                        {formatPrice(currentProduct.price)}
                      </p>
                    )}
                  </div>
                </div>
                <FavoriteButton
                  productId={currentProduct.id}
                  productData={{
                    id: currentProduct.id,
                    name: currentProduct.name,
                    price: currentProduct.price,
                    imageUrl: currentProduct.imageUrl,
                    category: currentProduct.category,
                    description: currentProduct.description,
                    stock: currentProduct.stock,
                  }}
                />
              </div>

              <p className="text-gray-700 mb-6">{currentProduct.description}</p>

              {/* Trust Badges */}
              <div className="space-y-4 mb-8">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Truck className="w-5 h-5" />
                    <span className="font-medium">{t('product.details.free_shipping')}</span>
                  </div>
                  <p className="text-sm text-green-700">{t('product.details.free_shipping_desc')}</p>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-blue-700">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="font-medium">{t('product.details.warranty')}</span>
                  </div>
                </div>

              </div>

              {/* Specifications Table */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">{t('product.specifications.title')}</h3>
                <div className="border rounded-lg overflow-hidden text-sm">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600 w-1/3">{t('product.specifications.brand')}</td>
                        <td className="px-3 py-2 font-medium">{currentProduct.brand || t('product.unknown_brand')}</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{t('product.specifications.model')}</td>
                        <td className="px-3 py-2 font-medium">{currentProduct.model || '-'}</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{t('product.specifications.movement')}</td>
                        <td className="px-3 py-2 font-medium">{currentProduct.movementType || 'Quartz'}</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{t('product.specifications.case_material')}</td>
                        <td className="px-3 py-2 font-medium">{currentProduct.caseMaterial || 'Stainless Steel'}</td>
                      </tr>
                      <tr className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{t('product.specifications.band_material')}</td>
                        <td className="px-3 py-2 font-medium">{currentProduct.bandMaterial || 'Stainless Steel'}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-gray-600">{t('product.specifications.water_resistance')}</td>
                        <td className="px-3 py-2 font-medium">{currentProduct.waterResistance || '50m'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* WhatsApp CTA Button */}
              <div className="space-y-3 mb-8">
                <Button
                  onClick={handleWhatsAppClick}
                  className="w-full py-4 text-lg flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-5 h-5" />
                  {t('product.details.whatsapp_cta')}
                </Button>
                <p className="text-center text-sm text-gray-600">
                  {t('product.details.whatsapp_description')}
                </p>
              </div>
            </div>

            {/* Embedded Checkout Form */}
            <div className="bg-gray-50 p-6 rounded-xl border">
              <div className="md:hidden mb-4">
                <Button
                  variant="outline"
                  onClick={() => setIsCheckoutExpanded(!isCheckoutExpanded)}
                  className="w-full"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  {isCheckoutExpanded 
                    ? t('checkout.hide_form') 
                    : t('checkout.show_form', { price: formatPrice(currentProduct.price) })
                  }
                </Button>
              </div>
              
              <div className={`${isCheckoutExpanded ? 'block' : 'hidden'} md:block`}>
                <div className="mb-4">
                  <h2 className="text-xl font-bold">{t('checkout.title')}</h2>
                  <p className="text-gray-600 text-sm">
                    {t('checkout.description', { productName: currentProduct.name })}
                  </p>
                </div>
                
                <Checkout
                  embedded={true}
                  product={currentProduct}
                  onOrderSuccess={() => {
                    // Optional: handle post-order logic
                  }}
                />
              </div>
            </div>
          </div>

          {/* Full-Size Images Stacked */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold mb-6">{t('product.details.product_images')}</h2>
            <div className="space-y-6">
              {displayImages.map((img, index) => (
                <div key={index} className="border rounded-lg overflow-hidden">
                  <img
                    src={img.url}
                    alt={`${currentProduct.name} full ${index + 1}`}
                    className="w-full object-contain h-auto max-h-[600px]"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Products */}
          <div className="mt-16">
            <RecommendedProducts 
              products={products} 
              currentProductId={currentProduct.id} 
            />
          </div>
        </>
      )}
    </div>
  );
};

export default ProductDetailsPage;