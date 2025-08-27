import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { Product, ProductImage } from '../types/product';
import useLocalStorage from '../hooks/useLocalStorage';
import { supabase } from '../utils/supabaseClient';

interface WatchSpecifications {
  movement: string;
  caseMaterial: string;
  caseDiameter: string;
  waterResistance: string;
  powerReserve: string;
  functions: string;
  strapMaterial: string;
  dialColor: string;
  [key: string]: string | number | boolean;
}

interface FavoritesContextType {
  favorites: Product[];
  loading: boolean;
  error: string | null;
  addToFavorites: (productId: string, productData?: Partial<Product>) => Promise<void>;
  removeFromFavorites: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
  refreshFavorites: () => Promise<void>;
}

const defaultSpecs: WatchSpecifications = {
  movement: '',
  caseMaterial: '',
  caseDiameter: '',
  waterResistance: '',
  powerReserve: '',
  functions: '',
  strapMaterial: '',
  dialColor: ''
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  
  const localStorageKey = currentUser ? `favorites_${currentUser.id}` : 'favorites_guest';
  const [localFavorites, setLocalFavorites] = useLocalStorage<string[]>(
    localStorageKey, 
    [], 
    { lazy: true, persistOnUpdate: true }
  );

  // Format product data consistently - memoize to prevent recreation
  const formatProduct = useCallback((product: any, specs: WatchSpecifications = defaultSpecs): Product => {
    // Handle images array - ensure it's always an array of ProductImage objects
    const images: ProductImage[] = [];
    
    // Case 1: Product has an images array
    if (Array.isArray(product.images)) {
      product.images.forEach((img: any) => {
        if (typeof img === 'string') {
          images.push({ url: img, isPrimary: images.length === 0 });
        } else if (img?.url) {
          images.push({
            url: img.url,
            isPrimary: img.isPrimary || images.length === 0,
            order: img.order,
            preview: img.preview
          });
        }
      });
    }
    
    // Case 2: Fallback to imageUrl if no images in array
    const primaryImageUrl = 
      (images.find(img => img.isPrimary)?.url) || // First check for primary image
      (images[0]?.url) || // Then first image in array
      (product.imageUrl) || // Then imageUrl field
      ''; // Finally fallback to empty string
    
    // Ensure at least one image exists if imageUrl was provided
    if (primaryImageUrl && !images.length) {
      images.push({
        url: primaryImageUrl,
        isPrimary: true
      });
    }
    
    return {
      ...product,
      images,
      // For backward compatibility, ensure imageUrl is always set to the primary image
      imageUrl: primaryImageUrl,
      specifications: product.specifications 
        ? { ...specs, ...product.specifications } 
        : { ...specs },
      features: product.features || [],
      inStock: product.inStock || 0,
      createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
      updatedAt: product.updatedAt ? new Date(product.updatedAt) : new Date()
    };
  }, []);

  // Define loadFavorites function at the component level
  const loadFavorites = useCallback(async () => {
    setLoading(true);
    try {
      let productIds: string[] = [];
      const currentKey = currentUser ? `favorites_${currentUser.id}` : 'favorites_guest';
      
      if (currentUser) {
        const { data: favoritesData, error } = await supabase
          .from('favorites')
          .select('product_id')
          .eq('user_id', currentUser.id);
        
        if (error) throw error;
        productIds = favoritesData?.map(fav => fav.product_id) || [];
      } else {
        const stored = localStorage.getItem(currentKey);
        productIds = stored ? JSON.parse(stored) : [];
      }
      
      if (productIds.length > 0) {
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .in('id', productIds);
          
        if (error) throw error;
        
        if (productsData) {
          setFavorites(productsData.map((p: any) => formatProduct(p, defaultSpecs)));
        }
      } else {
        setFavorites([]);
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites');
      throw err; // Re-throw to allow retry logic to catch
    } finally {
      setLoading(false);
    }
  }, [currentUser, formatProduct]);

  // Load favorites on mount and when user changes
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    let retryCount = 0;
    const maxRetries = 3;
    const retryDelay = 500; // ms

    const loadWithRetry = async (attempt = 1) => {
      if (!isMounted) return;
      
      try {
        await loadFavorites();
        retryCount = 0; // Reset retry count on success
      } catch (err) {
        if (!isMounted || controller.signal.aborted) return;
        
        console.error('Error loading favorites:', err);
        
        // Retry logic
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(`Retrying... (${retryCount}/${maxRetries})`);
          setTimeout(() => loadWithRetry(retryCount + 1), retryDelay * retryCount);
          return;
        }
        
        setError('Failed to load favorites');
      }
    };

    // Initial load with debounce
    const timer = setTimeout(() => {
      loadWithRetry();
    }, 100);
    
    return () => {
      isMounted = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [loadFavorites]); // Only depend on loadFavorites

  const addToFavorites = useCallback(async (productId: string, productData?: Partial<Product>) => {
    if (!productId) {
      throw new Error('No product ID provided');
    }

    setLoading(true);
    setError(null);
    
    try {
      // Create the new product with proper typing
      const newProduct: Product = {
        id: productId,
        name: productData?.name || 'Unnamed Product',
        price: productData?.price || 0,
        description: productData?.description || '',
        images: productData?.images || [],
        imageUrl: productData?.imageUrl || '',
        specifications: productData?.specifications 
          ? { ...defaultSpecs, ...productData.specifications } 
          : { ...defaultSpecs },
        features: productData?.features || [],
        inStock: productData?.inStock || 0,
        featured: productData?.featured || false, // Added required featured field
        isNew: productData?.isNew || false,
        isBestSeller: productData?.isBestSeller || false,
        stock_quantity: productData?.stock_quantity || productData?.inStock || 0,
        stock: productData?.stock || productData?.inStock || 0,
        createdAt: productData?.createdAt ? new Date(productData.createdAt) : new Date(),
        updatedAt: new Date(),
        created_at: productData?.createdAt ? new Date(productData.createdAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Optimistic update: Add to local state immediately for better UX
      setFavorites(prevFavorites => {
        if (prevFavorites.some(p => p.id === productId)) {
          return prevFavorites; // Already in favorites
        }
        return [...prevFavorites, formatProduct(newProduct, defaultSpecs)];
      });

      if (currentUser) {
        // Save to database for logged-in users
        const { error } = await supabase
          .from('favorites')
          .insert([{ user_id: currentUser.id, product_id: productId }]);
          
        if (error) throw error;
      } else {
        // Save to local storage for guests
        setLocalFavorites((prev: string[] = []) => [...prev, productId]);
      }
    } catch (err) {
      console.error('Error adding to favorites:', err);
      setError('Failed to add to favorites');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, setLocalFavorites]);

  const removeFromFavorites = useCallback(async (productId: string) => {
    if (!productId) return;

    setLoading(true);
    setError(null);
    
    try {
      // Optimistic update: Remove from local state immediately
      setFavorites(prev => prev.filter(p => p.id !== productId));
      
      if (currentUser) {
        // Remove from database for logged-in users
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('product_id', productId);
          
        if (error) throw error;
      } else {
        // Remove from local storage for guests
        setLocalFavorites(prev => (prev || []).filter(id => id !== productId));
      }
    } catch (err) {
      console.error('Error removing from favorites:', err);
      setError('Failed to remove from favorites');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser, setLocalFavorites]);

  const isFavorite = useCallback((productId: string): boolean => {
    return favorites.some(p => p.id === productId);
  }, [favorites]);

  const refreshFavorites = useCallback(async () => {
    try {
      await loadFavorites();
    } catch (err) {
      console.error('Error refreshing favorites:', err);
      setError('Failed to refresh favorites');
      throw err;
    }
  }, [loadFavorites]);

  const value = useMemo(() => ({
    favorites,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    refreshFavorites
  }), [favorites, loading, error, addToFavorites, removeFromFavorites, isFavorite, refreshFavorites]);

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
