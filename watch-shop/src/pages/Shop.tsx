import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import { Watch, SortOption, ProductImage } from '../types';
import { ProductCard } from '../components/ProductCard';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

type Filters = {
  category: string | null;
  brand: string | null;
  priceRange: [number, number];
  searchQuery: string;
};

const Shop = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const { products, loading, error, refreshProducts } = useProducts();
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    if (!loading && products.length > 0) {
      setInitialLoad(false);
    } else if (!loading && !initialLoad) {
      setInitialLoad(false);
    }
  }, [loading, products, initialLoad]);

  useEffect(() => {
    setInitialLoad(true);
    refreshProducts();
  }, [i18n.language, refreshProducts]);

  const watches = useMemo(() => {
    if (!products || products.length === 0) {
      return [];
    }

    return products.map(product => {
      const primaryImage = product.images?.find(img => img.isPrimary) || 
                          product.images?.[0] || 
                          { url: product.imageUrl || '' };

      const watch: Watch = {
        id: product.id,
        name: product.name || t('product.unknown_name'),
        brand: product.brand || t('product.unknown_brand'),
        price: Number(product.price) || 0,
        image: primaryImage.url || '',
        images: (product.images || []).map(img => ({
          url: img.url || '',
          alt: img.alt || product.name || t('product.watch_image'),
          isPrimary: img.isPrimary || false
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
        reviewCount: 0,
        createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
        updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date()
      };

      if (!watch.image && watch.images.length > 0) {
        watch.image = watch.images[0].url;
      }

      return watch;
    }).filter(watch => !!watch.image);
  }, [products, i18n.language, t]);

  const categories = useMemo(() => [t('shop.filter_options.all_categories'), ...new Set(watches.map(w => w.category))], [watches, t]);
  const brands = useMemo(() => [t('shop.filter_options.all_brands'), ...new Set(watches.map(w => w.brand))], [watches, t]);

  const getTranslatedCategory = (category: string) => {
    if (category === t('shop.filter_options.all_categories')) return category;
    return t(`categories.${category.toLowerCase()}`) || category;
  };

  const [filters, setFilters] = useState<Filters>(() => ({
    category: null,
    brand: null,
    priceRange: [0, 50000],
    searchQuery: ''
  }));

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    if (value === '') {
      const newPriceRange = [...filters.priceRange] as [number, number];
      newPriceRange[index] = 0;
      setFilters(prev => ({ ...prev, priceRange: newPriceRange }));
      return;
    }

    if (!/^\d*$/.test(value)) return;

    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;

    const newPriceRange = [...filters.priceRange] as [number, number];
    newPriceRange[index] = numValue;

    if (index === 0 && numValue > filters.priceRange[1]) {
      newPriceRange[1] = numValue;
    } else if (index === 1 && numValue < filters.priceRange[0]) {
      newPriceRange[0] = numValue;
    }

    setFilters(prev => ({ ...prev, priceRange: newPriceRange }));
  };

  const resetFilters = () => {
    setFilters({
      category: null,
      brand: null,
      priceRange: [0, 50000],
      searchQuery: ''
    });
  };

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
  const { addToCart } = useCart();

  const filteredWatches = useMemo(() => {
    if (watches.length === 0) {
      return [];
    }

    let filtered = watches.filter(watch => {
      const categoryMatch =
        filters.category === null ||
        watch.category === filters.category ||
        (filters.category === t('shop.filter_options.all_categories'));

      const brandMatch =
        filters.brand === null ||
        watch.brand === filters.brand ||
        (filters.brand === t('shop.filter_options.all_brands'));

      const price = Number(watch.price) || 0;
      const minPrice = filters.priceRange[0];
      const maxPrice = filters.priceRange[1];
      const priceInRange = price >= minPrice && price <= maxPrice;

      const searchQuery = filters.searchQuery.trim().toLowerCase();
      const searchMatch = !searchQuery ||
        watch.name.toLowerCase().includes(searchQuery) ||
        watch.brand.toLowerCase().includes(searchQuery) ||
        (watch.description && watch.description.toLowerCase().includes(searchQuery));

      return categoryMatch && brandMatch && priceInRange && searchMatch;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'price_low_high':
          return (a.price || 0) - (b.price || 0);
        case 'price_high_low':
          return (b.price || 0) - (a.price || 0);
        case 'newest':
          return (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0);
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
    toast.success(t('cart.added_to_cart', { name: product.name }), {
      duration: 3000,
      position: isRtl ? 'bottom-left' : 'bottom-right',
    });
  };

  return (
    <div 
      className="bg-gray-50 min-h-screen pt-24"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Mobile filter dialog */}
        <div className="lg:hidden">
          {mobileFiltersOpen && (
            <div className="fixed inset-0 z-40 flex">
              <div 
                className="fixed inset-0 bg-black bg-opacity-25" 
                onClick={() => setMobileFiltersOpen(false)} 
              />
              <div 
                className={`relative flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white py-4 pb-12 shadow-xl ${
                  isRtl ? 'mr-auto' : 'ml-auto'
                }`}
              >
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-lg font-medium text-gray-900">
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
                <div className="mt-4 px-4 space-y-6">
                  {/* Categories */}
                  <div>
                    <h3 className="text-sm font-semibold text-black mb-2">
                      {t('shop.filter_options.categories')}
                    </h3>
                    <div className="space-y-2">
                      {categories.map((category) => {
                        const translatedCategory = getTranslatedCategory(category);
                        return (
                          <div key={category} className="flex items-center">
                            <input
                              id={`mobile-category-${category}`}
                              name="category"
                              type="radio"
                              className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                              checked={filters.category === category || (filters.category === null && category === t('shop.filter_options.all_categories'))}
                              onChange={() => setFilters(prev => ({ ...prev, category }))}
                            />
                            <label
                              htmlFor={`mobile-category-${category}`}
                              className="ml-3 text-sm font-medium text-black"
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
                    <h3 className="text-sm font-semibold text-black mb-2">
                      {t('shop.filter_options.brands')}
                    </h3>
                    <div className="space-y-2">
                      {brands.map((brand) => (
                        <div key={brand} className="flex items-center">
                          <input
                            id={`mobile-brand-${brand}`}
                            name="brand"
                            type="radio"
                            className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                            checked={filters.brand === brand || (filters.brand === null && brand === t('shop.filter_options.all_brands'))}
                            onChange={() => setFilters(prev => ({ ...prev, brand }))}
                          />
                          <label
                            htmlFor={`mobile-brand-${brand}`}
                            className="ml-3 text-sm font-medium text-black"
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
                    <h3 className="text-sm font-semibold text-black mb-2">
                      {t('shop.filter_options.price_range')}
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="mobile-min-price" className="block text-sm font-medium text-black mb-1">
                            {t('shop.filter_options.min')}
                          </label>
                          <input
                            type="number"
                            id="mobile-min-price"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                            value={filters.priceRange[0]}
                            onChange={(e) => handlePriceChange(e, 0)}
                            min="0"
                          />
                        </div>
                        <div>
                          <label htmlFor="mobile-max-price" className="block text-sm font-medium text-black mb-1">
                            {t('shop.filter_options.max')}
                          </label>
                          <input
                            type="number"
                            id="mobile-max-price"
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
                    <h3 className="text-sm font-semibold text-black mb-2">
                      {t('shop.filter_options.search')}
                    </h3>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder={t('shop.filter_options.search_placeholder')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                        value={filters.searchQuery}
                        onChange={handleSearchChange}
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
              </div>
            </div>
          )}
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-x-8">
          {/* Desktop filters */}
          <aside className="hidden lg:block">
            <h2 className="sr-only">{t('shop.filters')}</h2>
            <div className="sticky top-24 space-y-6">
              {/* Categories */}
              <div>
                <h3 className="text-sm font-semibold text-black mb-2">
                  {t('shop.filter_options.categories')}
                </h3>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const translatedCategory = getTranslatedCategory(category);
                    return (
                      <div key={category} className="flex items-center">
                        <input
                          id={`desktop-category-${category}`}
                          name="category"
                          type="radio"
                          className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                          checked={filters.category === category || (filters.category === null && category === t('shop.filter_options.all_categories'))}
                          onChange={() => setFilters(prev => ({ ...prev, category }))}
                        />
                        <label
                          htmlFor={`desktop-category-${category}`}
                          className="ml-3 text-sm font-medium text-black"
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
                <h3 className="text-sm font-semibold text-black mb-2">
                  {t('shop.filter_options.brands')}
                </h3>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <div key={brand} className="flex items-center">
                      <input
                        id={`desktop-brand-${brand}`}
                        name="brand"
                        type="radio"
                        className="h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                        checked={filters.brand === brand || (filters.brand === null && brand === t('shop.filter_options.all_brands'))}
                        onChange={() => setFilters(prev => ({ ...prev, brand }))}
                      />
                      <label
                        htmlFor={`desktop-brand-${brand}`}
                        className="ml-3 text-sm font-medium text-black"
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
                <h3 className="text-sm font-semibold text-black mb-2">
                  {t('shop.filter_options.price_range')}
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="desktop-min-price" className="block text-sm font-medium text-black mb-1">
                        {t('shop.filter_options.min')}
                      </label>
                      <input
                        type="number"
                        id="desktop-min-price"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                        value={filters.priceRange[0]}
                        onChange={(e) => handlePriceChange(e, 0)}
                        min="0"
                      />
                    </div>
                    <div>
                      <label htmlFor="desktop-max-price" className="block text-sm font-medium text-black mb-1">
                        {t('shop.filter_options.max')}
                      </label>
                      <input
                        type="number"
                        id="desktop-max-price"
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
                <h3 className="text-sm font-semibold text-black mb-2">
                  {t('shop.filter_options.search')}
                </h3>
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('shop.filter_options.search_placeholder')}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-accent focus:ring-accent sm:text-sm"
                    value={filters.searchQuery}
                    onChange={handleSearchChange}
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
          </aside>

          {/* Product grid */}
          <div className="lg:col-span-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
              <div className="mb-4 md:mb-0">
                <h1 className="text-3xl font-bold tracking-tight text-black">
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
                  className="p-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
                  aria-label={t('shop.filters')}
                >
                  <FunnelIcon className="h-5 w-5" />
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
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="inline-flex items-center rounded-md border border-transparent bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-accent-dark focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2"
                    >
                      {t('shop.filter_options.reset_filters')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6" style={{ direction: 'ltr' }}>
                  {filteredWatches.map((watch) => {
                    const originalProduct = products.find(p => p.id === watch.id);
                    
                    const originalPrice = Number(originalProduct?.original_price) || Number(watch.price) || 0;
                    const salePrice = Number(watch.price) || 0;
                    const discount = originalPrice > 0 && salePrice < originalPrice 
                      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100) 
                      : 0;

                    const product = {
                      ...watch,
                      imageUrl: watch.image,
                      images: watch.images || [],
                      isNew: originalProduct?.isNew || false,
                      isBestSeller: originalProduct?.isBestSeller || false,
                      price: salePrice,
                      originalPrice: originalPrice,
                      discount: discount,
                      offPercentage: discount,
                      rating: 0,
                      reviewCount: 0,
                      stock: watch.inStock || 0,
                      brand: watch.brand === 'product.unknown_brand' ? t('product.unknown_brand') : (watch.brand || ''),
                      description: watch.description || '',
                      category: watch.category || 'watches',
                      featured: watch.isFeatured || false,
                      specifications: watch.specifications || {},
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
                          product={product}
                          onAddToCart={() => handleAddToCart(product)}
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
    </div>
  );
};

export default Shop;