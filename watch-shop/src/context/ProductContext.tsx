import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../utils/supabaseClient';
import { Product, ProductImage } from '../types/product';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<Product[]>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, imageFile: File) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>, imageFile?: File) => Promise<void>;
  deleteProduct: (id: string, imageUrl?: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the loadProducts function with useCallback to prevent unnecessary recreations
  const loadProducts = useCallback(async () => {
    console.log('Loading products...');
    setLoading(true);
    setError(null);
    
    let isMounted = true;
    
    try {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      
      console.log('Supabase client: Initialized');
      
      // Check if user is authenticated
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }
      
      console.log('Current user:', authData.user?.email || 'Not authenticated');
      
      const { data, error, status, statusText } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { status, statusText, error, data: data?.length });

      if (error) {
        console.error('Supabase query error:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw new Error(`Database error: ${error.message}`);
      }
      
      if (status >= 400) {
        throw new Error(`Request failed with status ${status}: ${statusText}`);
      }
      
      // If no data, set empty array and return
      if (!data) {
        if (isMounted) setProducts([]);
        return [];
      }
      
      // Map the database fields to our Product type
      return data.map(item => ({
        id: item.id,
        name: item.name || 'Unnamed Product',
        description: item.description || '',
        price: item.price,
        imageUrl: item.image_url,
        images: item.image_url ? [{ url: item.image_url, isPrimary: true }] : [],
        category: item.category || 'other',
        stock: item.stock_quantity || 0,
        featured: item.is_featured || false,
        specifications: item.specifications || {},
        createdAt: item.created_at ? new Date(item.created_at) : new Date(),
        updatedAt: item.updated_at ? new Date(item.updated_at) : new Date()
      }));
    } catch (err) {
      console.error('Error loading products:', err);
      if (isMounted) {
        setError(err instanceof Error ? err.message : 'Failed to load products');
      }
      throw err;
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
  }, []);

  // Create a stable refreshProducts function that won't change between renders
  const refreshProducts = useCallback(async (): Promise<Product[]> => {
    try {
      setLoading(true);
      const products = await loadProducts();
      if (products) {
        console.log('Setting products in state (refreshProducts):', products.length);
        setProducts(products);
        return products;
      }
      setProducts([]);
      return [];
    } catch (error) {
      console.error('Error in refreshProducts:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh products');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadProducts]);

  // Load products on mount
  useEffect(() => {
    let isMounted = true;
    
    const fetchProducts = async () => {
      try {
        const products = await loadProducts();
        if (isMounted && products) {
          console.log('Setting products in state (initial load):', products.length);
          setProducts(products);
        }
      } catch (error) {
        console.error('Error in initial product load:', error);
        if (isMounted) {
          setError('Failed to load products. Please try again later.');
        }
      }
    };

    // Only load products if we don't have any yet
    if (products.length === 0) {
      console.log('No products in state, fetching...');
      fetchProducts();
    } else {
      console.log('Products already loaded, skipping initial fetch');
    }

    return () => {
      isMounted = false;
    };
  }, [loadProducts, products.length]);

  const uploadImage = async (file: File): Promise<string> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('products')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      if (!imageUrl || !supabase) return;
      
      // Extract the file path from the URL
      const filePath = imageUrl.split('/').pop();
      if (!filePath) return;

      const { error } = await supabase.storage
        .from('products')
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      // Don't throw here, as we might still want to continue with product deletion
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, imageFile: File): Promise<void> => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      
      setLoading(true);
      
      // Upload image to Supabase Storage
      const imageUrl = await uploadImage(imageFile);
      
      // Get current user ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Insert product into Supabase
      const { data, error } = await supabase
        .from('products')
        .insert([{ 
          name: product.name,
          description: product.description,
          price: product.price,
          image_url: imageUrl,
          category: product.category,
          stock_quantity: product.stock,
          is_featured: product.featured,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      // Refresh products
      await loadProducts();
    } catch (err) {
      console.error('Error adding product:', err);
      setError('Failed to add product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>, imageFile?: File) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      
      setLoading(true);
      
      // If there's a new image, upload it
      let imageUrl = updates.imageUrl;
      if (imageFile) {
        // Delete old image if it exists
        if (updates.imageUrl) {
          await deleteImage(updates.imageUrl);
        }
        imageUrl = await uploadImage(imageFile);
      }
      
      // Prepare updates for Supabase
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      // Map our Product type to database fields
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.price !== undefined) updateData.price = updates.price;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.stock !== undefined) updateData.stock_quantity = updates.stock;
      if (updates.featured !== undefined) updateData.is_featured = updates.featured;
      if (imageUrl) updateData.image_url = imageUrl;
      
      // Remove any undefined values
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
      
      // Update product in Supabase
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh products
      await loadProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const deleteProduct = async (id: string, imageUrl?: string) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      
      setLoading(true);
      
      // Delete the image from storage if it exists
      if (imageUrl) {
        await deleteImage(imageUrl);
      }
      
      // Delete the product from the database
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh products
      await loadProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const getProductById = useCallback((id: string) => {
    return products.find(product => product.id === id);
  }, [products]);

  return (
    <ProductContext.Provider 
      value={{
        products,
        loading,
        error,
        refreshProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        getProductById
      }}
    >
      {children}
    </ProductContext.Provider>
  );
}

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
