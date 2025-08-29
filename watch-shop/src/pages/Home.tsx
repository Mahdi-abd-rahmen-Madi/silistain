import { useMemo, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { supabase } from '../lib/supabaseClient';
import toast from 'react-hot-toast';
import { Product } from '../types/product';
import { ProductCard } from '../components/ProductCard';
import { Button } from '../components/ui/Button';
import { HeroSection } from '../components/HeroSection';
import { ArrowRight, Truck, Shield, CheckCircle, Headset } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';

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
      name: product.name || 'Unnamed Product',
      brand: product.brand || 'Unknown Brand',
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
    <div className="pt-16 md:pt-20">
      {/* Hero Section */}
      <HeroSection />

      {/* Featured Collections */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Collections</h2>
            <p className="mt-4 text-lg text-gray-600">Discover our handpicked selection of premium timepieces</p>
          </div>
          
          <Tabs.Root 
            value={activeTab}
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            <div className="flex justify-center mb-8">
              <Tabs.List className="inline-flex space-x-1 rounded-lg bg-gray-100 p-1">
                <Tabs.Trigger 
                  value="featured" 
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'featured' 
                      ? 'bg-white text-accent shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Featured
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="new" 
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'new' 
                      ? 'bg-white text-accent shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  New Arrivals
                </Tabs.Trigger>
                <Tabs.Trigger 
                  value="bestsellers" 
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'bestsellers' 
                      ? 'bg-white text-accent shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Bestsellers
                </Tabs.Trigger>
              </Tabs.List>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
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
          
          <div className="mt-10 text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/shop" className="group">
                View All Products
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Truck className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Free Shipping</h3>
              <p className="text-gray-600">Free shipping on all orders</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">2-Year Warranty</h3>
              <p className="text-gray-600">Every watch comes with a 2-year warranty</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Authentic Products</h3>
              <p className="text-gray-600">100% authentic watches from top brands</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-gray-50 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Stay Updated</h2>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              Subscribe to our newsletter to receive updates on new arrivals, special offers, and exclusive deals.
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors"
                  required
                  disabled={isSubmitting}
                />
                <Button 
                  type="submit" 
                  className={`whitespace-nowrap ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Subscribing...' : 'Subscribe'}
                </Button>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                We respect your privacy. Unsubscribe at any time.
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
