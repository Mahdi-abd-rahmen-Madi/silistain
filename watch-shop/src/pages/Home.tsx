import { useMemo, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Product } from '../types/product';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/Button';
import { HeroSection } from '../components/HeroSection';
import { Send, ArrowRight, Truck, Shield, CheckCircle, Headset } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import '../styles/home.css'; // Import the CSS file

// Extended product type with additional properties needed for the UI
type MappedProduct = Omit<Product, 'createdAt' | 'updatedAt'> & {
  id: string;
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
  // Add any other required properties from Product type
  description?: string;
  category?: string;
  slug?: string;
  sku?: string;
};

const Home = () => {
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<string>('featured');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  
  // Map products to the format expected by ProductCard
  const productList = useMemo<MappedProduct[]>(() => {
    if (!products || products.length === 0) return [];
    
    return products.map((product): MappedProduct => ({
      ...product,
      id: product.id,
      name: product.name || t('product.unnamed_product'),
      brand: product.brand || t('product.unknown_brand'),
      price: Number(product.price) || 0,
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
      // Ensure all required properties are included
      description: product.description || '',
      category: product.category || '',
      slug: product.slug || `product-${product.id}`,
      sku: (product as any).sku || `SKU-${product.id}`
    }));
  }, [products, addToCart]);
  
  // Filter products for different sections
  const featuredProducts = useMemo<MappedProduct[]>(() => {
    console.log('All products:', productList);
    const featured = productList.filter(p => p.featured === true);
    console.log('Featured products:', featured);
    return featured.slice(0, 4);
  }, [productList]);
  
  const newArrivals = useMemo<MappedProduct[]>(() => 
    [...productList]
      .sort((a, b) => (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0))
      .slice(0, 4),
    [productList]
  );
  
  const bestSellers = useMemo<MappedProduct[]>(() => 
    [...productList]
      .sort((a, b) => (b.sold! - a.sold!))
      .slice(0, 4),
    [productList]
  );

  const renderProducts = (): MappedProduct[] => {
    switch (activeTab) {
      case 'new':
        return newArrivals;
      case 'bestsellers':
        return bestSellers;
      case 'featured':
      default:
        return featuredProducts;
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section - Fixed by removing the shopNowText prop */}
      <HeroSection />

      {/* Featured Collections */}
      <section className="featured-collections">
        <div className="collections-header">
          <div className="text-center mb-12">
            <h2 className="collections-title">{t('collections.title')}</h2>
            <p className="collections-subtitle">{t('collections.subtitle')}</p>
          </div>
          
          <Tabs.Root 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            className="collections-tabs"
          >
            <div className="flex justify-center mb-8">
              <Tabs.List className="tabs-list">
                <Tabs.Trigger 
                  value="featured" 
                  className={`tab-trigger ${activeTab === 'featured' ? 'tab-trigger-active' : 'tab-trigger-inactive'}`}
                >
                  {t('collections.filters.featured')}
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="new" 
                  className={`tab-trigger ${activeTab === 'new' ? 'tab-trigger-active' : 'tab-trigger-inactive'}`}
                >
                  {t('collections.filters.new_arrivals')}
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="bestsellers" 
                  className={`tab-trigger ${activeTab === 'bestsellers' ? 'tab-trigger-active' : 'tab-trigger-inactive'}`}
                >
                  {t('collections.filters.bestsellers')}
                </Tabs.Trigger>
              </Tabs.List>
            </div>
            
            <div className="product-grid">
              {renderProducts().map((product) => (
                <div key={product.id} className="w-full">
                  <ProductCard 
                    product={product} 
                    onAddToCart={() => addToCart(product, 1)} 
                  />
                </div>
              ))}
            </div>
          </Tabs.Root>
          
          <div className="view-all-button">
            <Button>
              <Link to="/shop">
                <Button variant="outline" className="mt-8">
                  {t('collections.view_all')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Truck className="h-6 w-6" />
            </div>
            <h3 className="feature-title">{t('collections.features.free_shipping')}</h3>
            <p className="feature-description">{t('collections.features.free_shipping_desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <Shield className="h-6 w-6" />
            </div>
            <h3 className="feature-title">{t('collections.features.warranty')}</h3>
            <p className="feature-description">{t('collections.features.warranty_desc')}</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">
              <CheckCircle className="h-6 w-6" />
            </div>
            <h3 className="feature-title">{t('collections.features.authentic')}</h3>
            <p className="feature-description">{t('collections.features.authentic_desc')}</p>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="newsletter-container">
          <div className="newsletter-content">
            <h2 className="newsletter-title">{t('collections.newsletter.title')}</h2>
            <p className="newsletter-description">
              {t('collections.newsletter.description')}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="newsletter-form">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.email')}
                className="newsletter-input"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="newsletter-button"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">{t('collections.newsletter.subscribing')}...</span>
                ) : (
                  <>
                    <span>{t('collections.newsletter.subscribe')}</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
            <p className="newsletter-privacy">
              {t('collections.newsletter.privacy')}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;