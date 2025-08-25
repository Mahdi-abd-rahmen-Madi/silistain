import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, HeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import FavoriteButton from '../components/FavoriteButton';

const FavoritesPage = () => {
  const { favorites, loading, error, refreshFavorites } = useFavorites();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await refreshFavorites();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (loading && !isRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error}
              </p>
              <div className="mt-2">
                <Button 
                  onClick={handleRefresh}
                  variant="outline"
                  size="sm"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? 'Refreshing...' : 'Try Again'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <Link 
            to="/shop" 
            className="inline-flex items-center text-gray-600 hover:text-accent transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Shop
          </Link>
          <Button 
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={isRefreshing}
            className="text-gray-600 hover:text-accent"
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mt-4 flex items-center">
          <HeartIcon className="h-8 w-8 text-red-500 mr-3" />
          Your Favorites
        </h1>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="mx-auto h-24 w-24 text-gray-200 mb-6">
            <HeartIcon className="h-full w-full" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Your favorites list is empty</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            You haven't saved any watches to your favorites yet. Start exploring our collection and add your favorites!
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild>
              <Link to="/shop">
                <ShoppingBagIcon className="h-5 w-5 mr-2" />
                Browse Watches
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/shop?sort=featured">
                View Featured
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-4 flex justify-between items-center mb-2">
            <p className="text-gray-600">{favorites.length} {favorites.length === 1 ? 'item' : 'items'}</p>
            <Button 
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              disabled={isRefreshing}
              className="text-gray-600 hover:text-accent"
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
          </div>
          {favorites.map((watch) => (
            <motion.div 
              key={watch.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to={`/watch/${watch.id}`} className="block">
                <div className="h-64 bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-4 relative">
                  <img 
                    src={typeof watch.images?.[0] === 'string' ? watch.images[0] : watch.images?.[0]?.url || '/placeholder-watch.jpg'}
                    alt={watch.name}
                    className="max-h-full max-w-full object-contain"
                  />
                  <div className="absolute top-3 right-3">
                    <FavoriteButton 
                      productId={watch.id} 
                      size="lg" 
                      variant="solid" 
                      className="shadow-md hover:shadow-lg transition-shadow"
                    />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 line-clamp-2 h-12">
                        {watch.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {watch.brand}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      ${typeof watch.price === 'number' ? watch.price.toFixed(2) : 'N/A'}
                    </p>
                  </div>
                  <div className="mt-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        // Add to cart logic here
                      }}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
