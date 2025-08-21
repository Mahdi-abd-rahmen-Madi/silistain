import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FunnelIcon, XMarkIcon, ShoppingCartIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { Watch, Filters, SortOption, ProductImage } from '../types';
import { ProductCard } from '../components/ProductCard';
import { toast } from 'react-hot-toast';

const Shop = () => {
  // Use products from ProductContext
  const { products, loading, error } = useProducts();
  const [initialLoad, setInitialLoad] = useState(true);
  
  // Set initial load to false when products are loaded
  useEffect(() => {
    if (!loading && products.length > 0) {
      console.log('Products loaded, initial load complete. Count:', products.length);
      setInitialLoad(false);
    } else if (!loading && !initialLoad) {
      console.log('No products loaded, but loading is complete');
      setInitialLoad(false);
    }
  }, [loading, products, initialLoad]);
  
  // Map products to Watch type for compatibility with the existing code
  const watches = useMemo(() => {
    if (!products || products.length === 0) {
      console.log('No products to map');
      return [];
    }
    
    console.log('Mapping products to watches:', products);
    const mapped = products.map(product => {
      // Ensure we have at least one image URL
      const primaryImage = product.images?.find(img => img.isPrimary) || 
                          product.images?.[0] || 
                          { url: product.imageUrl || '' };
      
      // Create the watch object with proper typing
      const watch: Watch = {
        id: product.id,
        name: product.name || 'Unnamed Product',
        brand: product.brand || 'Unknown Brand',
        price: Number(product.price) || 0,
        image: primaryImage.url || '',
        images: (product.images || []).map(img => ({
          url: img.url || '',
          alt: (img as any).alt || product.name || 'Watch image', // Temporary any cast to avoid TS errors
          isPrimary: (img as any).isPrimary || false
        })) as ProductImage[],
        category: product.category || 'Uncategorized',
        description: product.description || '',
        specifications: {
          movement: product.specifications?.movement || 'Automatic',
          caseMaterial: product.specifications?.caseMaterial || 'Stainless Steel',
          caseDiameter: product.specifications?.caseDiameter || '40mm',
          waterResistance: product.specifications?.waterResistance || '50m',
          powerReserve: product.specifications?.powerReserve || '40 hours',
          functions: product.specifications?.functions || 'Hours, Minutes, Seconds, Date'
        },
        features: ['Water Resistant', 'Scratch Resistant Glass'],
        inStock: Number(product.stock) || 0,
        isFeatured: Boolean(product.featured || product.isFeatured),
        onSale: false,
        originalPrice: Number(product.price) || 0,
        rating: 0,
        reviewCount: 0
      };
      
      // Ensure we have a valid image URL
      if (!watch.image && watch.images.length > 0) {
        watch.image = watch.images[0].url;
      }
      
      console.log(`Mapped product ${watch.name}:`, {
        id: watch.id,
        name: watch.name,
        brand: watch.brand,
        price: watch.price,
        category: watch.category,
        isFeatured: watch.isFeatured,
        image: watch.image,
        imageCount: watch.images.length
      });
      
      return watch;
    }).filter(watch => {
      // Filter out watches without images
      const hasImage = !!watch.image;
      if (!hasImage) {
        console.warn(`Product ${watch.name} has no image and will be filtered out`);
      }
      return hasImage;
    });
    
    console.log(`Finished mapping ${mapped.length} valid watches`);
    return mapped;
  }, [products]);
  
  // Log watches array changes
  useEffect(() => {
    if (watches.length > 0) {
      console.log('Watches array updated:', {
        length: watches.length,
        watches: watches.map(w => ({
          name: w.name,
          category: w.category,
          brand: w.brand,
          price: w.price,
          isFeatured: w.isFeatured,
          hasImage: !!w.image,
          imageCount: w.images?.length || 0
        }))
      });
      
      // Log details for the first few watches
      const watchesToLog = Math.min(3, watches.length);
      for (let i = 0; i < watchesToLog; i++) {
        const w = watches[i];
        console.log(`Watch ${i + 1}/${watches.length}:`, {
          name: w.name,
          brand: w.brand,
          price: w.price,
          category: w.category,
          isFeatured: w.isFeatured,
          image: w.image ? '✅' : '❌',
          imageCount: w.images?.length || 0
        });
      }
      
      // Force a filter update when watches are loaded
      setFilters(prevFilters => ({
        ...prevFilters,
        // This will trigger a re-render with the new watches
        priceRange: [prevFilters.priceRange[0], prevFilters.priceRange[1]]
      }));
      
    } else if (products.length > 0) {
      console.warn('No watches after mapping, but products exist:', {
        productCount: products.length,
        firstProduct: products[0] ? {
          id: products[0].id,
          name: products[0].name,
          hasImages: products[0].images?.length || 0,
          imageUrl: products[0].imageUrl ? '✅' : '❌'
        } : 'No products'
      });
    }
  }, [watches, products]);
  
  // Extract unique categories and brands
  const categories = useMemo(() => [...new Set(watches.map(watch => watch.category))], [watches]);
  const brands = useMemo(() => [...new Set(watches.map(watch => watch.brand))], [watches]);
  
  // Initialize filters with a function to prevent re-creation on every render
  const [filters, setFilters] = useState<Filters>(() => ({
    category: 'all',
    brand: 'all',
    priceRange: [0, 50000],
    searchQuery: ''
  }));
  
  // Log when filters change
  useEffect(() => {
    console.log('Filters updated:', filters);
  }, [filters]);
  
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [addingItem, setAddingItem] = useState<string | null>(null);
  const { addToCart } = useCart();

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = parseInt(e.target.value) || 0;
    const newPriceRange: [number, number] = [...filters.priceRange] as [number, number];
    newPriceRange[index] = value;
    
    // Ensure min is not greater than max and vice versa
    if (index === 0 && value > filters.priceRange[1]) {
      newPriceRange[1] = value;
    } else if (index === 1 && value < filters.priceRange[0]) {
      newPriceRange[0] = value;
    }
    
    setFilters(prev => ({
      ...prev,
      priceRange: newPriceRange
    }));
  };

  const resetFilters = () => {
    setFilters({
      category: 'all',
      brand: 'all',
      priceRange: [0, 50000],
      searchQuery: ''
    });
    setSortBy('featured');
  };



  const filteredWatches = useMemo(() => {
    console.log('Filtering watches with filters:', filters);
    console.log('Total watches to filter:', watches.length);
    
    // If no watches, return empty array immediately
    if (watches.length === 0) {
      console.log('No watches available to filter');
      return [];
    }
    
    // Log all watches before filtering for debugging
    console.log('All watches before filtering:', watches.map(w => ({
      name: w.name,
      category: w.category,
      brand: w.brand,
      price: w.price,
      isFeatured: w.isFeatured
    })));
    
    const filtered = watches.filter((watch) => {
      try {
        // Log each watch being filtered
        const watchInfo = {
          name: watch.name,
          category: watch.category,
          brand: watch.brand,
          price: watch.price,
          isFeatured: watch.isFeatured
        };
        
        console.log('Checking watch:', watchInfo);
        
        // Category filter - match if 'all' or category matches (case insensitive)
        const categoryMatch = filters.category === 'all' || 
                            (watch.category && 
                             watch.category.toLowerCase() === filters.category?.toLowerCase());
        
        // Brand filter - match if 'all' or brand matches (case insensitive)
        const brandMatch = filters.brand === 'all' || 
                          (watch.brand && 
                           watch.brand.toLowerCase() === filters.brand?.toLowerCase());
        
        // Price filter - ensure price is within range
        const price = Number(watch.price) || 0;
        const minPrice = Number(filters.priceRange[0]) || 0;
        const maxPrice = Number(filters.priceRange[1]) || Number.MAX_SAFE_INTEGER;
        const priceInRange = price >= minPrice && price <= maxPrice;
        
        // Search filter - only apply if there's a search query
        const searchQuery = (filters.searchQuery || '').trim().toLowerCase();
        const searchMatch = searchQuery === '' || 
                          (watch.name && watch.name.toLowerCase().includes(searchQuery)) ||
                          (watch.brand && watch.brand.toLowerCase().includes(searchQuery)) ||
                          (watch.description && watch.description.toLowerCase().includes(searchQuery));
        
        // Check if watch matches all active filters
        const shouldInclude = categoryMatch && brandMatch && priceInRange && searchMatch;
        
        // Log detailed info for debugging
        if (!shouldInclude) {
          console.log('Excluding watch:', watch.name, {
            categoryMatch,
            brandMatch,
            priceInRange,
            searchMatch,
            watchInfo,
            price,
            minPrice,
            maxPrice,
            activeFilters: {
              category: filters.category,
              brand: filters.brand,
              priceRange: filters.priceRange,
              searchQuery: filters.searchQuery
            }
          });
        } else {
          console.log('Including watch:', watch.name, {
            categoryMatch,
            brandMatch,
            priceInRange,
            searchMatch
          });
        }
        
        return shouldInclude;
      } catch (error) {
        console.error('Error filtering watch:', error, watch);
        return false; // Exclude if there's an error
      }
    });
    
    console.log(`Filtered ${filtered.length} out of ${watches.length} watches`);
    
    // If no matches but we have watches, log more details
    if (filtered.length === 0 && watches.length > 0) {
      console.warn('No watches matched all filters. Check filter criteria.');
      console.log('Available categories:', [...new Set(watches.map(w => w.category))]);
      console.log('Available brands:', [...new Set(watches.map(w => w.brand))]);
      
      const prices = watches.map(w => Number(w.price) || 0).filter(p => !isNaN(p));
      console.log('Price range of all watches:', [
        Math.min(...prices),
        Math.max(...prices)
      ]);
      
      // Log first few watches that were excluded
      console.log('Sample of excluded watches:', watches.slice(0, 3).map(w => ({
        name: w.name,
        category: w.category,
        brand: w.brand,
        price: w.price
      })));
    }
    
    return filtered
      .sort((a, b) => {
        switch (sortBy) {
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'name-asc':
            return a.name.localeCompare(b.name);
          case 'name-desc':
            return b.name.localeCompare(a.name);
          case 'featured':
          default:
            // Featured items first, then by name
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return a.name.localeCompare(b.name);
        }
      });
  }, [filters, sortBy]);

  // Handle add to cart through the consistent ProductCard component
  const handleAddToCart = (product: any) => {
    // Ensure we have a proper image URL
    const imageUrl = (product.images && product.images[0]) ? 
      (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].url) : 
      product.image || '';
    
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      brand: product.brand,
      image: imageUrl,
      quantity: 1
    };
    
    addToCart(cartItem);
    
    // Show success message
    toast.success(`${product.name} added to cart`);
    
    return false;
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-24">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mb-4 md:mb-0">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Luxury Watches</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Discover our exclusive collection of luxury timepieces
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:min-w-[300px]">
              <input
                type="text"
                placeholder="Search watches..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({...filters, searchQuery: e.target.value})}
                className="w-full rounded-lg border-0 bg-white py-2 pl-4 pr-10 text-sm text-gray-900 shadow-sm ring-1 ring-gray-200 focus:ring-2 focus:ring-accent dark:bg-gray-800 dark:text-white dark:ring-gray-700"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                type="button"
                className="inline-flex items-center rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 md:hidden"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <FunnelIcon className="mr-2 h-4 w-4" />
                Filters
              </button>

              <div className="relative w-full md:w-48">
                <label htmlFor="sort" className="sr-only">Sort by</label>
                <select
                  id="sort"
                  name="sort"
                  className="block w-full rounded-md border-gray-300 pl-3 pr-10 py-2 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                >
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="name-desc">Name: Z to A</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Mobile filter panel */}
          <AnimatePresence>
            {mobileFiltersOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white p-6 shadow-lg ring-1 ring-gray-900/10 dark:bg-gray-800 dark:ring-white/10 md:hidden"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h2>
                  <button
                    type="button"
                    className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    onClick={() => setMobileFiltersOpen(false)}
                  >
                    <span className="sr-only">Close menu</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
                
                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Category</h3>
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="category-mobile"
                          value="all"
                          checked={filters.category === 'all'}
                          onChange={() => setFilters({ ...filters, category: 'all' })}
                          className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">All Categories</span>
                      </label>
                      {categories.map((category) => (
                        <label key={`mobile-${category}`} className="flex items-center">
                          <input
                            type="radio"
                            name="category-mobile"
                            value={category}
                            checked={filters.category === category}
                            onChange={() => setFilters({ ...filters, category })}
                            className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                          />
                          <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{category}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Brand</h3>
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="brand-mobile"
                          value="all"
                          checked={filters.brand === 'all'}
                          onChange={() => setFilters({ ...filters, brand: 'all' })}
                          className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                        />
                        <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">All Brands</span>
                      </label>
                      {brands.map((brand) => (
                        <label key={`mobile-${brand}`} className="flex items-center">
                          <input
                            type="radio"
                            name="brand-mobile"
                            value={brand}
                            checked={filters.brand === brand}
                            onChange={() => setFilters({ ...filters, brand })}
                            className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                          />
                          <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Price Range</h3>
                    <div className="mt-2 space-y-4">
                      <div className="flex items-center justify-between space-x-4">
                        <div className="flex-1">
                          <label htmlFor="min-price-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Min
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              id="min-price-mobile"
                              value={filters.priceRange[0]}
                              onChange={(e) => handlePriceChange(e, 0)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                              min="0"
                              max={filters.priceRange[1] - 100}
                            />
                          </div>
                        </div>
                        <div className="flex-1">
                          <label htmlFor="max-price-mobile" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Max
                          </label>
                          <div className="mt-1">
                            <input
                              type="number"
                              id="max-price-mobile"
                              value={filters.priceRange[1]}
                              onChange={(e) => handlePriceChange(e, 1)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                              min={filters.priceRange[0] + 100}
                              max="50000"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="px-1">
                        <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                          <div 
                            className="h-1.5 rounded-full bg-accent"
                            style={{
                              width: `${((filters.priceRange[1] - filters.priceRange[0]) / 50000) * 100}%`,
                              marginLeft: `${(filters.priceRange[0] / 50000) * 100}%`
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        resetFilters();
                        setMobileFiltersOpen(false);
                      }}
                      className="w-full rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                    >
                      Reset all filters
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Desktop filters */}
          <div className="hidden lg:block">
            <div className="space-y-8">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Category</h3>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="category-desktop"
                      value="all"
                      checked={filters.category === 'all'}
                      onChange={() => setFilters({ ...filters, category: 'all' })}
                      className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">All Categories</span>
                  </label>
                  {categories.map((category) => (
                    <label key={`desktop-${category}`} className="flex items-center">
                      <input
                        type="radio"
                        name="category-desktop"
                        value={category}
                        checked={filters.category === category}
                        onChange={() => setFilters({ ...filters, category })}
                        className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Brand</h3>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="brand-desktop"
                      value="all"
                      checked={filters.brand === 'all'}
                      onChange={() => setFilters({ ...filters, brand: 'all' })}
                      className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                    />
                    <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">All Brands</span>
                  </label>
                  {brands.map((brand) => (
                    <label key={`desktop-${brand}`} className="flex items-center">
                      <input
                        type="radio"
                        name="brand-desktop"
                        value={brand}
                        checked={filters.brand === brand}
                        onChange={() => setFilters({ ...filters, brand })}
                        className="h-4 w-4 border-gray-300 text-accent focus:ring-accent"
                      />
                      <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">{brand}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Price Range</h3>
                <div className="mt-2 space-y-4">
                  <div className="flex items-center justify-between space-x-4">
                    <div className="flex-1">
                      <label htmlFor="min-price-desktop" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Min
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          id="min-price-desktop"
                          value={filters.priceRange[0]}
                          onChange={(e) => handlePriceChange(e, 0)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                          min="0"
                          max={filters.priceRange[1] - 100}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <label htmlFor="max-price-desktop" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Max
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          id="max-price-desktop"
                          value={filters.priceRange[1]}
                          onChange={(e) => handlePriceChange(e, 1)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                          min={filters.priceRange[0] + 100}
                          max="50000"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="px-1">
                    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700">
                      <div 
                        className="h-1.5 rounded-full bg-accent"
                        style={{
                          width: `${((filters.priceRange[1] - filters.priceRange[0]) / 50000) * 100}%`,
                          marginLeft: `${(filters.priceRange[0] / 50000) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Reset all filters
                </button>
              </div>
            </div>
          </div>

          {/* Product grid */}
          <div className="lg:col-span-3">
            {initialLoad ? (
              <div className="flex h-64 flex-col items-center justify-center space-y-4">
                <ArrowPathIcon className="h-12 w-12 animate-spin text-accent" />
                <p className="text-lg font-medium text-gray-700">
                  Loading products...
                </p>
              </div>
            ) : loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-t-4 border-t-accent border-gray-200"></div>
                <span className="ml-3 text-gray-600">Refreshing products...</span>
              </div>
            ) : error ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-red-300 bg-red-50 p-8 text-center">
                <div className="rounded-full bg-red-100 p-3">
                  <XMarkIcon className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-red-800">Error loading products</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Try again
                </button>
              </div>
            ) : filteredWatches.length === 0 ? (
              <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No watches found</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center rounded-md border border-transparent bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  >
                    Reset all filters
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {filteredWatches.map((watch) => {
                  // Find the original product to get the isBestSeller and isNew flags
                  const originalProduct = products.find(p => p.id === watch.id);
                  
                  // Convert Watch type to Product type for ProductCard
                  const product = {
                    ...watch,
                    imageUrl: watch.image,
                    images: watch.images || [],
                    isNew: originalProduct?.isNew || watch.isNew || false,
                    isBestSeller: originalProduct?.isBestSeller || watch.isBestSeller || false,
                    discount: watch.discount || 0,
                    rating: watch.rating || 0,
                    reviewCount: watch.reviewCount || 0,
                    stock: watch.inStock || 0,
                    // Ensure all required Product fields are included
                    brand: watch.brand || '',
                    description: watch.description || '',
                    category: watch.category || 'watches',
                    featured: watch.featured || false,
                    specifications: watch.specifications || {},
                    createdAt: watch.createdAt || new Date(),
                    updatedAt: watch.updatedAt || new Date()
                  };
                  
                  return (
                    <motion.div
                      key={watch.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <ProductCard 
                        product={product} 
                        onAddToCart={handleAddToCart}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
