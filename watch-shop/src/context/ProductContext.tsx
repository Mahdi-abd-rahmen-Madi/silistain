import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabaseClient';
import { Product, ProductImage } from '../types/product';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  refreshProducts: () => Promise<Product[]>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, imageFiles: File[]) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>, imageFiles?: File[]) => Promise<void>;
  deleteProduct: (id: string, imageUrl?: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  uploadImages: (files: File[]) => Promise<string[]>;
  deleteImages: (imageUrls: string[]) => Promise<void>;
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
      
      // Fetch products without requiring authentication
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
      const mappedProducts = data.map(item => {
        // Collect all available image URLs from image_url_1 to image_url_5
        const allImageUrls = [];
        for (let i = 1; i <= 5; i++) {
          const imageUrl = item[`image_url_${i}` as keyof typeof item];
          if (imageUrl && typeof imageUrl === 'string') {
            allImageUrls.push({
              url: imageUrl,
              isPrimary: i === 1,
              order: i - 1
            });
          }
        }
        
        // Fallback to the main image_url if no other images are found
        if (allImageUrls.length === 0 && item.image_url) {
          allImageUrls.push({
            url: item.image_url,
            isPrimary: true,
            order: 0
          });
        }
        
        return {
          id: item.id,
          name: item.name || 'Unnamed Product',
          description: item.description || '',
          price: item.price,
          imageUrl: item.image_url,
          images: allImageUrls,
          category: item.category || 'other',
          stock: item.stock_quantity || 0,
          featured: item.is_featured || false,
          isBestSeller: false,  // Will be set below
          isNew: false,         // Will be set below
          specifications: item.specifications || {},
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
          // Include individual image URLs for backward compatibility
          ...(allImageUrls[0] && { image_url_1: allImageUrls[0].url }),
          ...(allImageUrls[1] && { image_url_2: allImageUrls[1].url }),
          ...(allImageUrls[2] && { image_url_3: allImageUrls[2].url }),
          ...(allImageUrls[3] && { image_url_4: allImageUrls[3].url }),
          ...(allImageUrls[4] && { image_url_5: allImageUrls[4].url })
        };
      });

      // Sort by stock in descending order and mark the top item as Best Seller
      const sortedByStock = [...mappedProducts].sort((a, b) => b.stock - a.stock);
      if (sortedByStock.length > 0) {
        const bestSeller = sortedByStock[0];
        const bestSellerIndex = mappedProducts.findIndex(p => p.id === bestSeller.id);
        if (bestSellerIndex !== -1) {
          mappedProducts[bestSellerIndex].isBestSeller = true;
        }
      }

      // Sort by creation date and mark the latest item as New
      const sortedByDate = [...mappedProducts].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      if (sortedByDate.length > 0) {
        const newestItem = sortedByDate[0];
        const newestItemIndex = mappedProducts.findIndex(p => p.id === newestItem.id);
        if (newestItemIndex !== -1) {
          mappedProducts[newestItemIndex].isNew = true;
        }
      }

      return mappedProducts;
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
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      
      if (!data) {
        setProducts([]);
        return [];
      }
      
      // Map the database fields to our Product type
      const mappedProducts = data.map(item => {
        // Collect all available image URLs from image_url_1 to image_url_5
        const allImageUrls = [];
        for (let i = 1; i <= 5; i++) {
          const imageUrl = item[`image_url_${i}` as keyof typeof item];
          if (imageUrl && typeof imageUrl === 'string') {
            allImageUrls.push({
              url: imageUrl,
              isPrimary: i === 1,
              order: i - 1
            });
          }
        }
        
        // Fallback to the main image_url if no other images are found
        if (allImageUrls.length === 0 && item.image_url) {
          allImageUrls.push({
            url: item.image_url,
            isPrimary: true,
            order: 0
          });
        }
        
        return {
          id: item.id,
          name: item.name || 'Unnamed Product',
          description: item.description || '',
          price: item.price,
          imageUrl: item.image_url,
          images: allImageUrls,
          category: item.category || 'other',
          stock: item.stock_quantity || 0,
          featured: item.is_featured || false,
          isBestSeller: false,
          isNew: false,
          specifications: item.specifications || {},
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
          // Include individual image URLs for backward compatibility
          ...(allImageUrls[0] && { image_url_1: allImageUrls[0].url }),
          ...(allImageUrls[1] && { image_url_2: allImageUrls[1].url }),
          ...(allImageUrls[2] && { image_url_3: allImageUrls[2].url }),
          ...(allImageUrls[3] && { image_url_4: allImageUrls[3].url }),
          ...(allImageUrls[4] && { image_url_5: allImageUrls[4].url })
        };
      });
      
      setProducts(mappedProducts);
      return mappedProducts;
    } catch (error) {
      console.error('Error refreshing products:', error);
      setError(error instanceof Error ? error.message : 'Failed to refresh products');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

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
      const filePath = fileName; // Just use the filename, no subfolder
      const bucketName = 'products'; // Using 'products' bucket which exists in your storage

      console.log('Uploading image to bucket:', bucketName, 'path:', filePath);
      
      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting if file exists
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful, getting public URL...');
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      console.log('Generated public URL:', publicUrl);
      
      if (!publicUrl) {
        throw new Error('Failed to generate public URL for the uploaded image');
      }

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Upload multiple images
  const uploadImages = async (files: File[]): Promise<string[]> => {
    try {
      const uploadPromises = files.map(file => uploadImage(file));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const deleteImage = async (imageUrl: string) => {
    try {
      if (!imageUrl || !supabase) return;
      
      // Extract the file path from the URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(3).join('/'); // Remove the /storage/v1/object/public/ part
      
      const { error } = await supabase.storage
        .from('products') // Changed from 'product-images' to 'products' to match upload bucket
        .remove([filePath]);
        
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting image:', err);
      // Don't throw the error, as we still want to continue with the operation
    }
  };

  // Delete multiple images
  const deleteImages = async (imageUrls: string[]) => {
    try {
      if (!imageUrls || !imageUrls.length || !supabase) return;
      
      const filePaths = imageUrls.map(url => {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        return pathParts.slice(3).join('/');
      });
      
      const { error } = await supabase.storage
        .from('products')
        .remove(filePaths);
        
      if (error) throw error;
    } catch (err) {
      console.error('Error deleting images:', err);
      // Don't throw the error, as we still want to continue with the operation
    }
  };

  // Add a new product with multiple images
  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, imageFiles: File[]) => {
    if (!supabase) {
      throw new Error('Supabase client is not available');
    }

    try {
      setLoading(true);
      setError(null);

      // Upload all images first
      const imageUrls = await uploadImages(imageFiles);
      
      // Prepare images array with proper structure
      const productImages = imageUrls.map((url, index) => ({
        url,
        isPrimary: index === 0,
        order: index
      }));
      
      // Prepare product data for database
      const productData: any = {
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: imageUrls[0] || null, // First image as the main image for backward compatibility
        image_url_1: imageUrls[0] || null,
        image_url_2: imageUrls[1] || null,
        image_url_3: imageUrls[2] || null,
        image_url_4: imageUrls[3] || null,
        image_url_5: imageUrls[4] || null,
        category: product.category,
        stock_quantity: product.stock,
        is_featured: product.featured || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Only include specifications if it exists and has properties
      if (product.specifications && Object.keys(product.specifications).length > 0) {
        productData.specifications = product.specifications;
      }

      // Insert into database
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) throw error;
      
      // Refresh the products list
      await refreshProducts();
      
      return data;
    } catch (err) {
      console.error('Error adding product:', err);
      setError(err instanceof Error ? err.message : 'Failed to add product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing product with multiple images
  const updateProduct = async (id: string, updates: Partial<Product>, imageFiles: File[] = []) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      
      setLoading(true);
      setError(null);
      
      // Get the existing product to handle image cleanup
      const existingProduct = getProductById(id);
      if (!existingProduct) {
        throw new Error(`Product with ID ${id} not found`);
      }
      
      // Get existing image URLs, ensuring we only include valid, non-empty strings
      const existingImageUrls = [
        existingProduct.image_url_1,
        existingProduct.image_url_2,
        existingProduct.image_url_3,
        existingProduct.image_url_4,
        existingProduct.image_url_5
      ].filter((url): url is string => Boolean(url && url.trim()));
      
      let newImageUrls: string[] = [];
      
      // Upload new images if any
      if (imageFiles.length > 0) {
        try {
          newImageUrls = await uploadImages(imageFiles);
          console.log('Successfully uploaded new images:', newImageUrls);
        } catch (error) {
          console.error('Error uploading new images:', error);
          throw new Error('Failed to upload one or more images');
        }
      }
      
      // Get all existing non-empty image URLs from the product
      const existingNonEmptyUrls = existingImageUrls.filter(Boolean) as string[];
      
      // Combine existing and new images, ensuring no duplicates and limit to 5
      const allImageUrls = [...new Set([...existingNonEmptyUrls, ...newImageUrls])].slice(0, 5);
      
      // Initialize all image URL fields as null
      const imageFields: Record<string, string | null> = {
        // Always include all image fields, even if null, to clear empty ones in the database
        image_url: allImageUrls[0] || null, // First image is the main image
        image_url_1: allImageUrls[0] || null,
        image_url_2: allImageUrls[1] || null,
        image_url_3: allImageUrls[2] || null,
        image_url_4: allImageUrls[3] || null,
        image_url_5: allImageUrls[4] || null
      };
      
      console.log('Image fields being set:', imageFields);
      
      console.log('Updating product with image fields:', imageFields);
      
      // Prepare updates for Supabase
      const updateData: any = {
        // Map our Product type to database fields
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.stock !== undefined && { stock_quantity: updates.stock }),
        ...(updates.featured !== undefined && { is_featured: updates.featured }),
        // Only include specifications if it exists in updates
        ...(updates.specifications !== undefined && { 
          specifications: Object.keys(updates.specifications).length > 0 
            ? updates.specifications 
            : {}
        }),
        // Always update the updated_at timestamp
        updated_at: new Date().toISOString()
      };
      
      // Update the image fields in the update data
      Object.assign(updateData, imageFields);
      
      console.log('Updating product with data:', updateData);
      
      // Update the product in Supabase
      const { error } = await supabase
        .from('products')
        .update(updateData)
        .eq('id', id);
        
      if (error) {
        console.error('Supabase update error:', error);
        throw error;
      }
      
      console.log('Product updated successfully');
      
      // Fetch the updated product data
      const { data: updatedProduct, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) {
        console.error('Error fetching updated product:', fetchError);
        throw fetchError;
      }
      
      console.log('Fetched updated product:', updatedProduct);
      
      // Clean up old images that are no longer used
      const oldImagesToDelete = existingImageUrls.filter(url => !allImageUrls.includes(url));
      if (oldImagesToDelete.length > 0) {
        console.log('Cleaning up old images:', oldImagesToDelete);
        await deleteImages(oldImagesToDelete);
      }
      
      // Refresh products
      await refreshProducts();
    } catch (err) {
      console.error('Error updating product:', err);
      setError(err instanceof Error ? err.message : 'Failed to update product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a product
  const deleteProduct = async (id: string, imageUrl?: string) => {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not available');
      }
      
      setLoading(true);
      setError(null);
      
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
      await refreshProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Get a single product by ID
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
        getProductById,
        uploadImages,
        deleteImages
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
