import { useCallback } from 'react';
import { useFavorites } from '@/context/FavoritesContext';
import { FaHeart, FaRegHeart, FaSpinner } from 'react-icons/fa';
import { Product } from '@/types/product';

interface FavoriteButtonProps {
  productId: string;
  productData?: Partial<Product>;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
  onToggle?: (isFavorited: boolean) => void;
}

export default function FavoriteButton({ 
  productId, 
  productData,
  className = '',
  size = 'md',
  variant = 'ghost',
  onToggle
}: FavoriteButtonProps) {
  const { 
    isFavorite, 
    addToFavorites, 
    removeFromFavorites, 
    loading: contextLoading 
  } = useFavorites();
  
  const isFavorited = isFavorite(productId);
  const isProcessing = contextLoading;

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.group('FavoriteButton click handler');
    console.log('Button clicked. Current state:', {
      productId,
      isFavorited,
      isProcessing,
      hasProductData: !!productData
    });
    
    if (isProcessing) {
      console.log('Button is disabled, ignoring click');
      console.groupEnd();
      return;
    }
    
    try {
      if (isFavorited) {
        console.log('Removing from favorites');
        await removeFromFavorites(productId);
        console.log('Successfully removed from favorites');
        onToggle?.(false);
      } else {
        console.log('Adding to favorites');
        if (!productData) {
          const errorMsg = 'No product data provided for favorites';
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        console.log('Calling addToFavorites with:', { productId, productData });
        await addToFavorites(productId, productData);
        console.log('Successfully added to favorites');
        onToggle?.(true);
      }
    } catch (error) {
      console.error('Error in handleClick:', error);
      // Re-throw to ensure the error is visible in the console
      setTimeout(() => { throw error; });
    } finally {
      console.groupEnd();
    }
  }, [isFavorited, isProcessing, productId, productData, addToFavorites, removeFromFavorites, onToggle]);

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const buttonSize = size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-2.5' : 'p-2';
  
  return (
    <button
      onClick={handleClick}
      disabled={isProcessing}
      className={`
        flex items-center justify-center
        rounded-full transition-colors
        ${buttonSize}
        ${variant === 'outline' ? 'border border-gray-300 dark:border-gray-600' : ''}
        ${variant === 'solid' ? 'bg-white/90 dark:bg-gray-800/90 shadow-sm' : ''}
        ${isFavorited 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500'
        } 
        ${isProcessing ? 'opacity-70 cursor-not-allowed' : 'hover:scale-110'}
        ${className}
      `}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      aria-busy={isProcessing}
    >
      {isProcessing ? (
        <FaSpinner className={`${iconSize} animate-spin`} />
      ) : isFavorited ? (
        <FaHeart className={iconSize} />
      ) : (
        <FaRegHeart className={iconSize} />
      )}
    </button>
  );
}
