import { useState, FormEvent, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Shield, Truck, Zap, CheckCircle, Star } from 'lucide-react';
import * as Tabs from '@radix-ui/react-tabs';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { useCart } from '../context/CartContext';
import watchesData from '../data/watches';
import { Watch } from '../types';
import { Product } from '../types/product';
import ProductCard from '../components/ProductCard';
import { Button } from '../components/ui/Button';
import { useToast } from '../hooks/use-toast';

type ProductImage = {
  url: string;
  isPrimary?: boolean;
  order?: number;
};

// Function to convert Watch to Product
const watchToProduct = (watch: Watch): Product => {
  // Ensure watch.images is an array of strings
  const imageUrls = Array.isArray(watch.images) ? watch.images : [watch.image].filter(Boolean);
  
  return {
    ...watch,
    images: imageUrls.map((url: string | ProductImage) => {
      // If it's already a ProductImage, return it as is
      if (typeof url !== 'string') {
        return {
          ...url,
          isPrimary: url.isPrimary ?? url.url === watch.image,
          order: url.order ?? 0
        };
      }
      // If it's a string, create a ProductImage object
      return {
        url,
        isPrimary: url === watch.image,
        order: 0
      };
    }),
    stock: watch.inStock,
    specifications: {
      ...watch.specifications,
      // Ensure all required specification fields are present
      movement: watch.specifications.movement || '',
      caseMaterial: watch.specifications.caseMaterial || '',
      caseDiameter: watch.specifications.caseDiameter || '',
      waterResistance: watch.specifications.waterResistance || '',
      powerReserve: watch.specifications.powerReserve || '',
      functions: watch.specifications.functions || ''
    },
    // Add any missing required fields
    featured: watch.isFeatured,
    quantity: 1,
    discount: 0,
    isNew: watch.releaseDate ? new Date(watch.releaseDate).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000 : false,
    isBestSeller: (watch.sold || 0) > 50
  }
};

// Prepare watch collections
const watches = watchesData as Watch[];
const featuredWatches = watches.filter((watch) => watch.isFeatured).map(watchToProduct);
const newArrivals = [...watches]
  .sort((a, b) => (b.releaseDate ? new Date(b.releaseDate).getTime() : 0) - (a.releaseDate ? new Date(a.releaseDate).getTime() : 0))
  .slice(0, 4)
  .map(watchToProduct);
const bestSellers = [...watches]
  .sort((a, b) => (b.sold || 0) - (a.sold || 0))
  .slice(0, 4)
  .map(watchToProduct);

const Home = () => {
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('featured');
  
  const handleNewsletterSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    
    toast({
      title: 'Thank you for subscribing!',
      description: `We've added ${email} to our newsletter.`,
    });
    form.reset();
  };

  return (
    <div className="pt-16 md:pt-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center opacity-10"></div>
          <div className="absolute top-1/3 -right-20 w-72 h-72 bg-accent/10 rounded-full filter blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text content */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-center lg:text-left"
            >
              <motion.span 
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Zap className="h-4 w-4 mr-1" />
                New Collection 2025
              </motion.span>
              
              <motion.h1 
                className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                Timeless Elegance on Your Wrist
              </motion.h1>
              
              <motion.p 
                className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                Discover our curated collection of premium watches that combine precision engineering with exquisite design. 
                Each timepiece tells a story of craftsmanship and innovation.
              </motion.p>
              
              <motion.div 
                className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
              >
                <Button size="lg" asChild>
                  <Link to="/shop" className="group">
                    Shop Collection
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/about">Learn More</Link>
                </Button>
              </motion.div>
              
              <motion.div 
                className="mt-12 flex flex-wrap justify-center lg:justify-start gap-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-accent/10 p-2 rounded-full">
                    <Truck className="h-6 w-6 text-accent" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                    <p className="text-xs text-gray-500">On all orders over $100</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-accent/10 p-2 rounded-full">
                    <Shield className="h-6 w-6 text-accent" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">2-Year Warranty</p>
                    <p className="text-xs text-gray-500">Guaranteed quality</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Hero Image */}
            <motion.div 
              className="relative"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="relative z-10 w-full max-w-lg mx-auto">
                <img
                  src="https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1000&q=80"
                  alt="Luxury watch"
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
                
                {/* Floating badge */}
                <motion.div 
                  className="absolute -bottom-4 -right-4 bg-white rounded-full shadow-lg p-3"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-accent/10 p-2 rounded-full">
                      <Clock className="h-6 w-6 text-accent" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Limited Time</p>
                      <p className="text-xs text-gray-500">20% off</p>
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-accent/5 rounded-full filter blur-3xl"></div>
              <div className="absolute -top-10 -right-10 w-60 h-60 bg-primary/5 rounded-full filter blur-3xl"></div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">Our Collections</h2>
            <p className="mt-4 text-lg text-gray-600">Discover our handpicked selection of premium timepieces</p>
          </div>
          
          <Tabs.Root 
            defaultValue="featured" 
            className="w-full"
            onValueChange={(value) => setActiveTab(value)}
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
            
            <ScrollArea.Root className="w-full overflow-hidden">
              <ScrollArea.Viewport className="w-full pb-6">
                <Tabs.Content value="featured" className="outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {featuredWatches.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={(product) => {
  // Get the first image URL or fall back to imageUrl
  const imageUrl = product.images?.[0]?.url || product.imageUrl || '';
  
  const cartItem = {
    id: product.id.toString(),
    name: product.name,
    price: parseFloat(product.price.toString()),
    quantity: 1,
    brand: product.brand,
    image: typeof imageUrl === 'string' ? imageUrl : ''
  };
  
  addToCart(cartItem);
}}
                      />
                    ))}
                  </div>
                </Tabs.Content>
                
                <Tabs.Content value="new" className="outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {newArrivals.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={(product) => {
  // Get the first image URL or fall back to imageUrl
  const imageUrl = product.images?.[0]?.url || product.imageUrl || '';
  
  const cartItem = {
    id: product.id.toString(),
    name: product.name,
    price: parseFloat(product.price.toString()),
    quantity: 1,
    brand: product.brand,
    image: typeof imageUrl === 'string' ? imageUrl : ''
  };
  
  addToCart(cartItem);
}}
                      />
                    ))}
                  </div>
                </Tabs.Content>
                
                <Tabs.Content value="bestsellers" className="outline-none">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {bestSellers.map((product) => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        onAddToCart={(product) => {
  // Get the first image URL or fall back to imageUrl
  const imageUrl = product.images?.[0]?.url || product.imageUrl || '';
  
  const cartItem = {
    id: product.id.toString(),
    name: product.name,
    price: parseFloat(product.price.toString()),
    quantity: 1,
    brand: product.brand,
    image: typeof imageUrl === 'string' ? imageUrl : ''
  };
  
  addToCart(cartItem);
}}
                      />
                    ))}
                  </div>
                </Tabs.Content>
              </ScrollArea.Viewport>
              <ScrollArea.Scrollbar className="flex select-none touch-none p-0.5 bg-gray-100 transition-colors duration-[160ms] ease-out hover:bg-gray-200 data-[orientation=horizontal]:h-2.5 data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col" orientation="horizontal">
                <ScrollArea.Thumb className="flex-1 bg-gray-400 rounded-[10px] relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" />
              </ScrollArea.Scrollbar>
            </ScrollArea.Root>
            
            <div className="mt-10 text-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/shop" className="group">
                  View All Products
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </Tabs.Root>
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
              <p className="text-gray-600">Free shipping on all orders over $100</p>
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
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-colors"
                  required
                />
                <Button type="submit" className="whitespace-nowrap">
                  Subscribe
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
