import { useState, useEffect } from 'react';
import { useFavorites } from '../context/FavoritesContext';
import { FaHeart, FaRegHeart } from 'react-icons/fa';

interface FavoriteButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'ghost' | 'outline' | 'solid';
}

export default function FavoriteButton({ 
  productId, 
  className = '',
  size = 'md',
  variant = 'ghost'
}: FavoriteButtonProps) {
  const { isFavorite, addToFavorites, removeFromFavorites, loading } = useFavorites();
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setIsFavorited(isFavorite(productId));
  }, [productId, isFavorite]);

  const handleClick = async () => {
    if (loading || isProcessing) return;
    
    setIsProcessing(true);
    try {
      if (isFavorited) {
        await removeFromFavorites(productId);
      } else {
        await addToFavorites(productId);
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('Error updating favorites:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || isProcessing}
      className={`
        rounded-full transition-colors
        ${size === 'sm' ? 'p-1.5' : size === 'lg' ? 'p-2.5' : 'p-2'}
        ${variant === 'outline' ? 'border border-gray-300 dark:border-gray-600' : ''}
        ${variant === 'solid' ? 'bg-white/90 dark:bg-gray-800/90 shadow-sm' : ''}
        ${isFavorited 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500'
        } ${className}
      `}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFavorited ? (
        <FaHeart className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
      ) : (
        <FaRegHeart className={size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5'} />
      )}
    </button>
  );
}
