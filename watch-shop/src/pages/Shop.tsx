import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FunnelIcon, XMarkIcon, ShoppingCartIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { Watch, Filters, SortOption, ProductImage } from '../types';
import { ProductCard } from '../components/ProductCard';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Shop = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';
  
  // Use products from ProductContext
  const { products, loading, error, refreshProducts } = useProducts();
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
  
  // Refresh products when language changes
  useEffect(() => {
    refreshProducts();
  }, [i18n.language, refreshProducts]);
  
  // Map products to Watch type for compatibility with the existing code
  const watches = useMemo(() => {
    if (!products || products.length === 0) {
      console.log('No products to map');
      return [];
    }
    
    console.log(`Mapping products to watches (${i18n.language}):`, products);
    const mapped = products.map(product => {
      // Ensure we have at least one image URL
      const primaryImage = product.images?.find(img => img.isPrimary) || 
                          product.images?.[0] || 
                          { url: product.imageUrl || '' };
      
      // Create the watch object with proper typing
      const watch: Watch = {
        id: product.id,
        name: product.name || t('product.unnamed_product'),
        // Store the brand as is, we'll handle translation in the component
        brand: product.brand || t('shop.product.unknown_brand'),
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
  }, [products, t, i18n.language]);
  
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
  const categories = useMemo(() => [t('shop.filter_options.all_categories'), ...new Set(watches.map(watch => watch.category))], [watches, t]);
  const brands = useMemo(() => [t('shop.filter_options.all_brands'), ...new Set(watches.map(watch => watch.brand))], [watches, t]);
  
  // Get translated category name
  const getTranslatedCategory = (category: string) => {
    if (category === t('shop.filter_options.all_categories')) return category;
    return t(`categories.${category.toLowerCase()}`) || category;
  };
  
  // Initialize filters with translated 'all' values
  const [filters, setFilters] = useState<Filters>(() => ({
    category: t('shop.filter_options.all_categories'),
    brand: t('shop.filter_options.all_brands'),
    priceRange: [0, 50000],
    searchQuery: ''
  }));
  
  // Log when filters change
  useEffect(() => {
    console.log('Filters updated:', filters);
  }, [filters]);
  
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  
  const sortOptions = [
    { value: 'featured', label: t('shop.sort_options.featured') },
    { value: 'price_low_high', label: t('shop.sort_options.price_low_high') },
    { value: 'price_high_low', label: t('shop.sort_options.price_high_low') },
    { value: 'newest', label: t('shop.sort_options.newest') },
    { value: 'name_az', label: t('shop.sort_options.name_az') },
    { value: 'name_za', label: t('shop.sort_options.name_za') },
  ];
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
      category: t('shop.filter_options.all_categories'),
      brand: t('shop.filter_options.all_brands'),
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
    
    let filtered = watches.filter((watch) => {
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
        const categoryMatch = 
          filters.category.toLowerCase() === t('shop.filter_options.all_categories').toLowerCase() || 
          (watch.category && 
           watch.category.toLowerCase() === filters.category?.toLowerCase());
        
        // Brand filter - match if 'all' or brand matches (case insensitive)
        const brandMatch = 
          filters.brand.toLowerCase() === t('shop.filter_options.all_brands').toLowerCase() || 
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
    
    // Sort the filtered results
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price_low_high':
          return (a.price || 0) - (b.price || 0);
        case 'price_high_low':
          return (b.price || 0) - (a.price || 0);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'name_az':
          return (a.name || '').localeCompare(b.name || '');
        case 'name_za':
          return (b.name || '').localeCompare(a.name || '');
        case 'featured':
        default:
          return ((b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)) || (a.name || '').localeCompare(b.name || '');
      }
    });
  }, [watches, filters, sortBy, t]);

  const handleAddToCart = (product: any) => {
    addToCart(product);
    toast.success(`${product.name} added to cart`, {
      duration: 3000,
      position: isRtl ? 'bottom-left' : 'bottom-right',
    });
  };

  // Filter panel component
  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {t('shop.filter_options.categories')}
        </h3>
        <div className="space-y-2">
          {categories.map((category) => {
            const translatedCategory = getTranslatedCategory(category);
            return (
              <div key={category} className="flex items-center">
                <input
                  id={`category-${category}`}
                  name="category"
                  type="radio"
                  className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                  checked={filters.category === category}
                  onChange={() => setFilters(prev => ({ ...prev, category }))}
                />
                <label
                  htmlFor={`category-${category}`}
                  className="ml-3 text-sm text-gray-600 dark:text-gray-300"
                  style={isRtl ? { marginRight: '0.75rem', marginLeft: '0' } : {}}
                >
                  {translatedCategory}
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brands */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {t('shop.filter_options.brands')}
        </h3>
        <div className="space-y-2">
          {brands.map((brand) => (
            <div key={brand} className="flex items-center">
              <input
                id={`brand-${brand}`}
                name="brand"
                type="radio"
                className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                checked={filters.brand === brand}
                onChange={() => setFilters(prev => ({ ...prev, brand }))}
              />
              <label
                htmlFor={`brand-${brand}`}
                className="ml-3 text-sm text-gray-600 dark:text-gray-300"
                style={isRtl ? { marginRight: '0.75rem', marginLeft: '0' } : {}}
              >
                {brand}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {t('shop.filter_options.price_range')}
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="min-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('shop.filter_options.min')}
              </label>
              <input
                type="number"
                id="min-price"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                value={filters.priceRange[0]}
                onChange={(e) => handlePriceChange(e, 0)}
                min="0"
              />
            </div>
            <div>
              <label htmlFor="max-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('shop.filter_options.max')}
              </label>
              <input
                type="number"
                id="max-price"
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                value={filters.priceRange[1]}
                onChange={(e) => handlePriceChange(e, 1)}
                min={filters.priceRange[0]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          {t('shop.filter_options.search')}
        </h3>
        <div className="relative">
          <input
            type="text"
            placeholder={t('shop.filter_options.search_placeholder')}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
            value={filters.searchQuery}
            onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
          />
        </div>
      </div>

      {/* Reset Filters */}
      <button
        type="button"
        onClick={resetFilters}
        className="mt-4 w-full rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
      >
        {t('shop.filter_options.reset_filters')}
      </button>
    </div>
  );

  return (
    <div 
      className="bg-gray-50 dark:bg-gray-900 min-h-screen pt-24"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Mobile filter dialog */}
        <div className="lg:hidden">
          <AnimatePresence>
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-40 flex">
                <div 
                  className="fixed inset-0 bg-black bg-opacity-25" 
                  onClick={() => setMobileFiltersOpen(false)} 
                />
                <div 
                  className={`relative flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white dark:bg-gray-800 py-4 pb-12 shadow-xl ${
                    isRtl ? 'mr-auto' : 'ml-auto'
                  }`}
                >
                  <div className="flex items-center justify-between px-4">
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                      {t('shop.filters')}
                    </h2>
                    <button
                      type="button"
                      className="-mr-2 flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-accent"
                      onClick={() => setMobileFiltersOpen(false)}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-4 px-4">
                    <FilterPanel />
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-x-8">
          {/* Desktop filters */}
          <aside className="hidden lg:block">
            <h2 className="sr-only">{t('shop.filters')}</h2>
            <div className="sticky top-24 space-y-6">
              <FilterPanel />
            </div>
          </aside>

          {/* Product grid */}
          <div className="lg:col-span-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {t('shop.title')}
                </h1>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {t('shop.description')}
                </p>
              </div>
              
              <div className="flex items-center space-x-4" style={isRtl ? { flexDirection: 'row-reverse' } : {}}>
                <button
                  type="button"
                  onClick={() => setMobileFiltersOpen(true)}
                  className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  style={isRtl ? { flexDirection: 'row-reverse' } : {}}
                >
                  <FunnelIcon className={`mr-2 h-5 w-5 ${isRtl ? 'ml-2 mr-0' : ''}`} />
                  {t('shop.filters')}
                </button>
              </div>
            </div>

            <div className="pt-4">
              {loading || initialLoad ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">{t('shop.error_loading')}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {t('common.retry')}
                  </button>
                </div>
              ) : filteredWatches.length === 0 ? (
                <div className="text-center py-12">
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                    {t('shop.no_products')}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t('shop.try_adjusting_filters')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" style={{ direction: 'ltr' }}>
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
                      brand: watch.brand === 'product.unknown_brand' ? t('product.unknown_brand') : (watch.brand || ''),
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
                        className="w-full"
                      >
                        <ProductCard
                          key={`${watch.id}-${i18n.language}`}
                          product={product}
                          onAddToCart={() => handleAddToCart(product)}
                        />
                      </motion.div>
                    );
                  })}
                </div>
              )}
              {filteredWatches.length === 0 && (
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center rounded-md border border-transparent bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                  >
                    {t('shop.filter_options.reset_filters')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;