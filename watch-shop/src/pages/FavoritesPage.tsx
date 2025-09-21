import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '@/context/FavoritesContext';
import { HeartIcon } from '@heroicons/react/24/outline';
import { Button } from '../components/ui/Button';
import FavoriteButton from '../components/FavoriteButton';
import { formatPrice } from '../lib/utils';
import type { Product } from '@/types/product';

const FavoritesPage = () => {
  const { favorites, loading, error, refreshFavorites } = useFavorites();
  const navigate = useNavigate();
  
  // Initial load
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        await refreshFavorites();
      } catch (err) {
        console.error('Error loading favorites:', err);
      }
    };
    
    loadFavorites();
  }, [refreshFavorites]);

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
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your favorites...</p>
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
          <HeartIcon className="w-16 h-16 text-gray-400 mx-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No favorites yet</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          Your favorite watches will appear here. Start adding some from the shop!
        </p>
        <Button onClick={() => navigate('/shop')}>
          Browse Watches
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-16 pb-8">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Favorites</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((product: Product) => {
          // Get the first available image URL
          let imageUrl = '/placeholder-watch.jpg';
          
          if (product.images?.length > 0) {
            // Find primary image or use the first one
            const primaryImage = product.images.find((img: any) => img.isPrimary) || product.images[0];
            imageUrl = typeof primaryImage === 'string' ? primaryImage : primaryImage?.url || imageUrl;
          } else if (product.imageUrl) {
            // Fallback to imageUrl if no images array
            imageUrl = product.imageUrl;
          } else if (product.image) {
            // Handle direct image property if it exists
            imageUrl = product.image;
          }
              
          return (
            <div key={product.id} className="group relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
              <div className="absolute top-2 right-2 z-10">
                <FavoriteButton productId={product.id} size="lg" />
              </div>
              
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={product.name}
                    className="h-64 w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-64 w-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                    <span className="text-gray-400">No image</span>
                  </div>
                )}
              </div>
              
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1 line-clamp-1">
                  {product.name}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {formatPrice(product.price || 0)}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/product/${product.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FavoritesPage;
