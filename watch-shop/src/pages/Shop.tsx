import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FunnelIcon, XMarkIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useCart } from '../context/CartContext';
import watchesData from "../data/watches";
import { Watch, Filters, SortOption } from '../types';
import { assertIsWatchesArray } from '../utils/typeGuards';

const Shop = () => {
  // Ensure watches data is properly typed
  const [watches, setWatches] = useState<Watch[]>([]);
  
  // Initialize watches data
  useEffect(() => {
    try {
      assertIsWatchesArray(watchesData);
      setWatches(watchesData);
    } catch (error) {
      console.error('Error initializing watches data:', error);
    }
  }, []);
  
  // Extract unique categories and brands
  const categories = useMemo(() => [...new Set(watches.map(watch => watch.category))], [watches]);
  const brands = useMemo(() => [...new Set(watches.map(watch => watch.brand))], [watches]);
  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    brand: 'all',
    priceRange: [0, 50000],
    searchQuery: ''
  });
  
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState<boolean>(false);
  const [addingItem, setAddingItem] = useState<number | null>(null);
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

  // Validate watches data on component mount
  useEffect(() => {
    try {
      assertIsWatchesArray(watchesData);
      setWatches(watchesData);
    } catch (error) {
      console.error('Invalid watches data:', error);
    }
  }, []);

  const filteredWatches = useMemo(() => {
    return watches
      .filter((watch) => {
        const matchesCategory = filters.category === 'all' || watch.category === filters.category;
        const matchesBrand = filters.brand === 'all' || watch.brand === filters.brand;
        const matchesPrice = watch.price >= filters.priceRange[0] && watch.price <= filters.priceRange[1];
        const searchLower = filters.searchQuery.toLowerCase();
        const matchesSearch = 
          watch.name.toLowerCase().includes(searchLower) ||
          watch.brand.toLowerCase().includes(searchLower) ||
          (watch.description && watch.description.toLowerCase().includes(searchLower));
        
        return matchesCategory && matchesBrand && matchesPrice && matchesSearch;
      })
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

  const handleAddToCart = (watch: Omit<Watch, 'quantity'>) => {
    setAddingItem(watch.id);
    addToCart(watch);
    
    // Reset the adding state after animation would complete
    setTimeout(() => {
      setAddingItem(null);
    }, 1000);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
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
            {filteredWatches.length === 0 ? (
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
                {filteredWatches.map((watch) => (
                  <motion.div
                    key={watch.id}
                    className="group relative overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:shadow-md dark:bg-gray-800"
                    whileHover={{ y: -5 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="relative">
                      <Link to={`/watch/${watch.id}`} className="block">
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-xl bg-gray-200 dark:bg-gray-700">
                          <img
                            src={watch.images[0]}
                            alt={watch.name}
                            className="h-full w-full object-cover object-center transition-opacity duration-300 group-hover:opacity-90"
                          />
                        </div>
                      </Link>
                      
                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleAddToCart(watch);
                        }}
                        disabled={watch.inStock === 0}
                        className={`absolute top-3 right-3 rounded-full p-2 shadow-md transition-all duration-300 ${
                          watch.inStock === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-white hover:bg-indigo-50 hover:shadow-lg transform hover:-translate-y-0.5'
                        }`}
                        aria-label="Add to cart"
                      >
                        {addingItem === watch.id ? (
                          <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <ShoppingCartIcon className="h-5 w-5" />
                        )}
                      </button>
                      
                      {/* Stock status */}
                      {watch.inStock > 0 && watch.inStock <= 5 && (
                        <span className="text-sm text-yellow-600 dark:text-yellow-400">
                          Only {watch.inStock} left
                        </span>
                      )}
                      {watch.inStock === 0 && (
                        <span className="text-sm text-red-600 dark:text-red-400">Out of stock</span>
                      )}

                      {/* Sale badge */}
                      {watch.onSale && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                          Sale
                        </span>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                            <Link to={`/watch/${watch.id}`}>
                              <span aria-hidden="true" className="absolute inset-0" />
                              {watch.name}
                            </Link>
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{watch.brand}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            ${watch.price.toLocaleString()}
                          </p>
                          {watch.originalPrice && watch.originalPrice > watch.price && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                              ${watch.originalPrice.toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center">
                        <div className="flex items-center">
                          {[0, 1, 2, 3, 4].map((rating) => (
                            <svg
                              key={rating}
                              className={`h-5 w-5 ${
                                (watch.rating !== undefined && watch.rating > rating) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                              }`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                          {watch.reviewCount !== undefined && `(${watch.reviewCount} reviews)`}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;
