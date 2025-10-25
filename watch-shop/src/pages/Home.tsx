import { useMemo, useState, FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { useCategories } from '../context/CategoryContext'; // ✅ NEW
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Product } from '../types/product';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/Button';
import { Send, ArrowRight, Truck, Shield, CheckCircle, Search } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import '../styles/home.css';

type MappedProduct = Omit<Product, 'createdAt' | 'updatedAt'> & {
  id: string;
  stock_quantity: number;
  is_featured: boolean;
  name: string;
  brand: string;
  price: number;
  image: string;
  images: Array<{
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  stock: number;
  sold: number;
  featured: boolean;
  isNew: boolean;
  isBestSeller: boolean;
  specifications: {
    movement: string;
    caseMaterial: string;
    caseDiameter: string;
    waterResistance: string;
    powerReserve: string;
    functions: string;
  };
  onAddToCart: () => void;
  createdAt?: Date;
  updatedAt?: Date;
  description?: string;
  category?: string;
  slug?: string;
  sku?: string;
};

const Home = () => {
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { categories: allCategories, loading: categoriesLoading } = useCategories(); // ✅ NEW
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('featured');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !email) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('newsletter_subscriptions')
        .upsert(
          { email, is_active: true },
          { onConflict: 'email', ignoreDuplicates: false }
        )
        .select();

      if (error) {
        if (error.code === '23505') {
          toast.error('You\'re already subscribed to our newsletter!');
        } else {
          throw error;
        }
      } else {
        setEmail('');
        toast.success('Successfully subscribed to our newsletter!');
      }
    } catch (err) {
      console.error('Error subscribing to newsletter:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const productList = useMemo<MappedProduct[]>(() => {
    if (!products || products.length === 0) return [];

    return products.map((product): MappedProduct => ({
      ...product,
      id: product.id,
      name: product.name || t('product.unnamed_product'),
      brand: product.brand || t('product.unknown_brand'),
      price: Number(product.price) || 0,
      stock_quantity: product.stock_quantity || 0,
      is_featured: Boolean(product.is_featured),
      image: (product.images?.[0]?.url || '') as string,
      images: (product.images || []).map(img => ({
        url: img.url || '',
        alt: (img as any).alt || product.name || 'Product image',
        isPrimary: (img as any).isPrimary || false
      })),
      stock: product.stock || 0,
      sold: (product as any).sold || 0,
      featured: Boolean(product.featured),
      isNew: Boolean(product.isNew),
      isBestSeller: Boolean(product.isBestSeller),
      specifications: {
        movement: product.specifications?.movement || '',
        caseMaterial: product.specifications?.caseMaterial || '',
        caseDiameter: product.specifications?.caseDiameter || '',
        waterResistance: product.specifications?.waterResistance || '',
        powerReserve: product.specifications?.powerReserve || '',
        functions: product.specifications?.functions || ''
      },
      onAddToCart: () => addToCart(product, 1),
      description: product.description || '',
      category: product.category || '',
      slug: product.slug || `product-${product.id}`,
      sku: (product as any).sku || `SKU-${product.id}`
    }));
  }, [products, addToCart, t]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productList;
    const query = searchQuery.toLowerCase();
    return productList.filter(
      p =>
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query)
    );
  }, [productList, searchQuery]);

  const featuredProducts = useMemo<MappedProduct[]>(() => 
    filteredProducts.filter(p => p.featured).slice(0, 4),
    [filteredProducts]
  );

  const newArrivals = useMemo<MappedProduct[]>(() =>
    [...filteredProducts]
      .sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))
      .slice(0, 4),
    [filteredProducts]
  );

  const bestSellers = useMemo<MappedProduct[]>(() =>
    [...filteredProducts]
      .sort((a, b) => (b.sold! - a.sold!))
      .slice(0, 4),
    [filteredProducts]
  );

  // Reusable product grid renderer
  const renderProductGrid = (products: MappedProduct[]) => (
    <div className="product-grid">
      {products.map((product) => (
        <div key={product.id} className="w-full">
          <ProductCard
            product={product}
            onAddToCart={() => addToCart(product, 1)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="home-container">
      {/* Search Bar */}
      <section className="search-section py-4 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative max-w-xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search.placeholder') || 'Search products...'}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {/* ✅ DYNAMIC CATEGORIES SECTION */}
      <section className="categories-section py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center mb-6">
            {t('categories.title') || 'Shop by Category'}
          </h2>
          {categoriesLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-600"></div>
            </div>
          ) : allCategories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {allCategories.map((category) => {
                const [imageError, setImageError] = useState(false);
                const [retryCount, setRetryCount] = useState(0);
                
                const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
                  const img = e.currentTarget;
                  
                  if (retryCount < 2) {
                    // Try loading the image again with a small delay
                    setTimeout(() => {
                      const src = img.src;
                      img.src = '';
                      setTimeout(() => {
                        img.src = src;
                        setRetryCount(prev => prev + 1);
                      }, 200);
                    }, 500);
                    return;
                  }
                  
                  // Only show error in development
                  if (process.env.NODE_ENV === 'development') {
                    console.warn(`Failed to load image for category ${category.name}:`, category.image_url);
                  }
                  
                  setImageError(true);
                };

                return (
                  <Link
                    key={category.id}
                    to={`/shop?category=${category.slug}`}
                    className="category-card group text-center p-4 rounded-lg border border-gray-200 hover:border-brand-500 transition-colors hover:shadow-md"
                  >
                    {!imageError && category.image_url ? (
                      <div className="mb-3 flex justify-center h-16">
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="max-w-full max-h-16 w-auto object-contain"
                          onError={handleImageError}
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-gray-500 font-medium text-lg">
                          {category.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <h3 className="font-medium text-gray-900 group-hover:text-brand-600">
                      {category.name}
                    </h3>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              {t('categories.empty') || 'No categories available'}
            </div>
          )}
        </div>
      </section>

      {/* Collections: Mobile = stacked sections | Desktop = tabs */}
      <section className="featured-collections py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="collections-header">
            <div className="text-center mb-12">
              <h2 className="collections-title">{t('collections.title')}</h2>
              <p className="collections-subtitle">{t('collections.subtitle')}</p>
            </div>

            {/* Desktop: Tabbed Interface (hidden on mobile) */}
            <div className="hidden md:block">
              <Tabs.Root
                value={activeTab}
                onValueChange={(value) => setActiveTab(value)}
                className="collections-tabs"
              >
                <div className="flex justify-center mb-8">
                  <Tabs.List className="tabs-list flex space-x-2">
                    <Tabs.Trigger
                      value="featured"
                      className={`tab-trigger px-4 py-2 rounded-lg font-medium ${
                        activeTab === 'featured'
                          ? 'tab-trigger-active bg-brand-600 text-white'
                          : 'tab-trigger-inactive bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t('collections.filters.featured')}
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="new"
                      className={`tab-trigger px-4 py-2 rounded-lg font-medium ${
                        activeTab === 'new'
                          ? 'tab-trigger-active bg-brand-600 text-white'
                          : 'tab-trigger-inactive bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t('collections.filters.new_arrivals')}
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      value="bestsellers"
                      className={`tab-trigger px-4 py-2 rounded-lg font-medium ${
                        activeTab === 'bestsellers'
                          ? 'tab-trigger-active bg-brand-600 text-white'
                          : 'tab-trigger-inactive bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {t('collections.filters.bestsellers')}
                    </Tabs.Trigger>
                  </Tabs.List>
                </div>

                <div className="product-grid">
                  {activeTab === 'featured' && renderProductGrid(featuredProducts)}
                  {activeTab === 'new' && renderProductGrid(newArrivals)}
                  {activeTab === 'bestsellers' && renderProductGrid(bestSellers)}
                </div>
              </Tabs.Root>
            </div>

            {/* Mobile: Stacked Sections (only on small screens) */}
            <div className="md:hidden space-y-12">
              {/* Featured */}
              {featuredProducts.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-center">
                    {t('collections.filters.featured')}
                  </h3>
                  {renderProductGrid(featuredProducts)}
                </div>
              )}

              {/* New Arrivals */}
              {newArrivals.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-center">
                    {t('collections.filters.new_arrivals')}
                  </h3>
                  {renderProductGrid(newArrivals)}
                </div>
              )}

              {/* Best Sellers */}
              {bestSellers.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-center">
                    {t('collections.filters.bestsellers')}
                  </h3>
                  {renderProductGrid(bestSellers)}
                </div>
              )}
            </div>

            <div className="text-center mt-8">
              <Link to="/shop">
                <Button variant="outline">
                  {t('collections.view_all')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="feature-card text-center p-6">
              <div className="feature-icon flex justify-center mb-3">
                <Truck className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="feature-title font-semibold">{t('collections.features.free_shipping')}</h3>
              <p className="feature-description text-gray-600 mt-1">
                {t('collections.features.free_shipping_desc')}
              </p>
            </div>
            <div className="feature-card text-center p-6">
              <div className="feature-icon flex justify-center mb-3">
                <Shield className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="feature-title font-semibold">{t('collections.features.warranty')}</h3>
              <p className="feature-description text-gray-600 mt-1">
                {t('collections.features.warranty_desc')}
              </p>
            </div>
            <div className="feature-card text-center p-6">
              <div className="feature-icon flex justify-center mb-3">
                <CheckCircle className="h-6 w-6 text-brand-600" />
              </div>
              <h3 className="feature-title font-semibold">{t('collections.features.authentic')}</h3>
              <p className="feature-description text-gray-600 mt-1">
                {t('collections.features.authentic_desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section py-12 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="newsletter-container bg-white p-8 rounded-xl shadow-sm">
            <div className="newsletter-content text-center">
              <h2 className="newsletter-title text-2xl font-bold mb-2">
                {t('collections.newsletter.title')}
              </h2>
              <p className="newsletter-description text-gray-600 mb-6">
                {t('collections.newsletter.description')}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="newsletter-form flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.email')}
                  className="newsletter-input flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="newsletter-button flex items-center justify-center px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <span className="animate-pulse">{t('collections.newsletter.subscribing')}...</span>
                  ) : (
                    <>
                      <span>{t('collections.newsletter.subscribe')}</span>
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
              <p className="newsletter-privacy text-sm text-gray-500 mt-4">
                {t('collections.newsletter.privacy')}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;