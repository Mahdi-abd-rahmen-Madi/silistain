import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from './AuthContext';
import { Database } from '../types/database.types';
import { Product } from '../types/product';

interface FavoritesContextType {
  favorites: Product[];
  loading: boolean;
  error: string | null;
  addToFavorites: (productId: string) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  const fetchFavorites = useCallback(async () => {
    if (!currentUser || !supabase) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // First get the product IDs from favorites
      const { data: favoritesData, error: favError } = await supabase
        .from('favorites')
        .select('product_id')
        .eq('user_id', currentUser.id);
      
      if (favError) throw favError;
      
      if (!favoritesData || favoritesData.length === 0) {
        setFavorites([]);
        return;
      }
      
      // Then fetch the actual products
      const productIds = favoritesData.map(fav => fav.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);
      
      if (productsError) throw productsError;
      
      // Map the products to our Product type
      const favoriteProducts: Product[] = (productsData || []).map((product: any) => ({
        id: product.id,
        name: product.name || 'Unnamed Product',
        price: product.price || 0,
        description: product.description || '',
        images: Array.isArray(product.images) ? product.images : [],
        specifications: product.specifications || {},
        category: product.category || 'other',
        brand: product.brand || 'Unknown',
        createdAt: product.created_at || new Date().toISOString(),
        updatedAt: product.updated_at || new Date().toISOString()
      }));
      
      setFavorites(favoriteProducts);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [currentUser, fetchFavorites]);

  const addToFavorites = useCallback(async (productId: string) => {
    if (!currentUser?.id || !supabase) return;
    
    try {
      // First check if the product exists
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('id', productId)
        .single();
      
      if (productError || !product) {
        throw new Error('Product not found');
      }
      
      // Add to favorites
      const { error } = await supabase
        .from('favorites')
        .insert({ 
          user_id: currentUser.id, 
          product_id: productId 
        })
        .select()
        .single();
      
      if (error) {
        // Ignore duplicate key errors (already favorited)
        if (error.code !== '23505') {
          throw error;
        }
      }
      
      // Refresh favorites after adding
      await fetchFavorites();
    } catch (err) {
      console.error('Error adding to favorites:', err);
      throw err;
    }
  }, [currentUser, fetchFavorites]);

  const removeFromFavorites = useCallback(async (productId: string) => {
    if (!currentUser?.id || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', currentUser.id)
        .eq('product_id', productId);
      
      if (error) throw error;
      
      // Update local state immediately for better UX
      setFavorites(prev => prev.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error removing from favorites:', err);
      // Re-fetch from server to ensure consistency
      await fetchFavorites();
      throw err;
    }
  }, [currentUser, fetchFavorites]);

  const isFavorite = useCallback((productId: string) => {
    if (!favorites) return false;
    return favorites.some(product => product?.id === productId);
  }, [favorites]);

  const value = {
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    refreshFavorites: fetchFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
