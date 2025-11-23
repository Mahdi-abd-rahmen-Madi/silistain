import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { supabase, getAdminClient } from '../lib/supabaseClient';
import { uploadFile } from '../utils/supabaseStorage';
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
      console.log('First product data from DB:', JSON.stringify(data?.[0], null, 2));
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
        // Collect all available image URLs from image_url_1 to image_url_10
        const allImageUrls = [];
        for (let i = 1; i <= 10; i++) {
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
        
        // Create product object with all required properties
        const product: Product = {
          id: item.id,
          name: item.name || 'Unnamed Product',
          description: item.description || '',
          price: item.price || 0,
          offPercentage: item.off_percentage || 0,
          original_price: item.original_price || null,
          imageUrl: item.image_url || '',
          images: allImageUrls,
          category: item.category || 'other',
          brand: item.brand || undefined,        // ← This is critical!
          brand_id: item.brand_id || undefined,  // ← Optional, but good for completeness
          // Required properties from Product interface
          stock_quantity: item.stock_quantity || 0,
          is_featured: Boolean(item.is_featured),
          // Aliases for convenience
          stock: item.stock_quantity || 0,
          featured: Boolean(item.is_featured),
          // Additional properties
          isBestSeller: false,  // Will be set below
          isNew: false,         // Will be set below
          specifications: item.specifications || {},
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
          // Include individual image URLs for backward compatibility
          ...(allImageUrls[0] && { image_url_1: allImageUrls[0].url }),
          ...(allImageUrls[1] && { image_url_2: allImageUrls[1]?.url }),
          ...(allImageUrls[2] && { image_url_3: allImageUrls[2]?.url }),
          ...(allImageUrls[3] && { image_url_4: allImageUrls[3]?.url }),
          ...(allImageUrls[4] && { image_url_5: allImageUrls[4]?.url }),
          ...(allImageUrls[5] && { image_url_6: allImageUrls[5]?.url }),
          ...(allImageUrls[6] && { image_url_7: allImageUrls[6]?.url }),
          ...(allImageUrls[7] && { image_url_8: allImageUrls[7]?.url }),
          ...(allImageUrls[8] && { image_url_9: allImageUrls[8]?.url }),
          ...(allImageUrls[9] && { image_url_10: allImageUrls[9]?.url })
        };
        
        return product;
      });

      // Sort by stock in descending order and mark the top item as Best Seller
      const sortedByStock = [...mappedProducts].sort((a, b) => {
        const stockA = a.stock_quantity ?? 0;
        const stockB = b.stock_quantity ?? 0;
        return stockB - stockA;
      });
      
      if (sortedByStock.length > 0) {
        const bestSeller = sortedByStock[0];
        const bestSellerIndex = mappedProducts.findIndex(p => p.id === bestSeller.id);
        if (bestSellerIndex !== -1) {
          mappedProducts[bestSellerIndex] = {
            ...mappedProducts[bestSellerIndex],
            isBestSeller: true
          };
        }
      }

      // Sort by creation date and mark the latest item as New
      const sortedByDate = [...mappedProducts].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      if (sortedByDate.length > 0) {
        const newestItem = sortedByDate[0];
        const newestItemIndex = mappedProducts.findIndex(p => p.id === newestItem.id);
        if (newestItemIndex !== -1) {
          mappedProducts[newestItemIndex] = {
            ...mappedProducts[newestItemIndex],
            isNew: true
          };
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
      
      if (!data) return [];
      
      const mappedProducts: Product[] = data.map(item => {
        try {
          // Process images from the database
          const allImageUrls: ProductImage[] = [];
          
          // Add main image if it exists
          if (item.image_url) {
            allImageUrls.push({
              url: item.image_url,
              isPrimary: true,
              order: 0
            });
          }
          
          // Add additional images if they exist
          for (let i = 1; i <= 10; i++) {
            const imageUrl = item[`image_url_${i}` as keyof typeof item];
            if (imageUrl && typeof imageUrl === 'string') {
              allImageUrls.push({
                url: imageUrl,
                isPrimary: i === 1 && !item.image_url, // First image is primary if no main image
                order: i
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
          
          // Create product object with all required properties
          const product: Product = {
            id: item.id,
            name: item.name || 'Unnamed Product',
            description: item.description || '',
            price: item.price || 0,
            imageUrl: item.image_url || '',
            images: allImageUrls,
            category: item.category || 'other',
            brand: item.brand || undefined,        // ← This is critical!
            brand_id: item.brand_id || undefined,  // ← Optional, but good for completeness
            // Required properties from Product interface
            stock_quantity: item.stock_quantity || 0,
            is_featured: Boolean(item.is_featured),
            // Aliases for convenience
            stock: item.stock_quantity || 0,
            featured: Boolean(item.is_featured),
            // Additional properties
            isBestSeller: false,
            isNew: false,
            offPercentage: item.off_percentage || 0,
            original_price: item.original_price || null,
            specifications: item.specifications || {},
            createdAt: item.created_at ? new Date(item.created_at) : new Date(),
            updatedAt: item.updated_at ? new Date(item.updated_at) : new Date(),
            // Include individual image URLs for backward compatibility
            ...(allImageUrls[0] && { image_url_1: allImageUrls[0].url }),
            ...(allImageUrls[1] && { image_url_2: allImageUrls[1].url }),
            ...(allImageUrls[2] && { image_url_3: allImageUrls[2].url }),
            ...(allImageUrls[3] && { image_url_4: allImageUrls[3].url }),
            ...(allImageUrls[4] && { image_url_5: allImageUrls[4].url }),
            ...(allImageUrls[5] && { image_url_6: allImageUrls[5].url }),
            ...(allImageUrls[6] && { image_url_7: allImageUrls[6].url }),
            ...(allImageUrls[7] && { image_url_8: allImageUrls[7].url }),
            ...(allImageUrls[8] && { image_url_9: allImageUrls[8].url }),
            ...(allImageUrls[9] && { image_url_10: allImageUrls[9].url })
          };
          
          return product;
        } catch (error) {
          console.error('Error mapping product:', item.id, error);
          // Return a minimal valid product object in case of error
          return {
            id: item.id || 'error',
            name: 'Error loading product',
            description: '',
            price: 0,
            imageUrl: '',
            images: [],
            category: 'other',
            stock_quantity: 0,
            is_featured: false,
            stock: 0,
            featured: false,
            isBestSeller: false,
            isNew: false,
            offPercentage: 0,
            original_price: null,
            specifications: {},
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }
      }).filter((p): p is Product => p !== undefined);
      
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

      const bucketName = 'products'; // Using 'products' bucket which exists in your storage
      const filePath = 'uploads'; // Subfolder in the bucket

      console.log('Uploading image to bucket:', bucketName, 'path:', filePath);
      
      // Use our uploadFile utility which handles WebP conversion
      const { publicUrl, error: uploadError } = await uploadFile(file, bucketName, filePath);

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful, public URL:', publicUrl);
      
      if (!publicUrl) {
        throw new Error('Failed to get public URL for the uploaded image');
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
      if (!imageUrl) return;
      
      // Get the admin client to bypass RLS
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client is not available');
      }
      
      // Extract the file path from the URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(3).join('/'); // Remove the /storage/v1/object/public/ part
      
      const { error } = await adminClient.storage
        .from('products')
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
      if (!imageUrls || !imageUrls.length) return;
      
      // Get the admin client to bypass RLS
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client is not available');
      }
      
      const filePaths = imageUrls.map(url => {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        return pathParts.slice(3).join('/');
      });
      
      const { error } = await adminClient.storage
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
    // Get the admin client for this operation
    const adminClient = await getAdminClient();
    if (!adminClient) {
      throw new Error('Admin client is not available. Make sure VITE_SUPABASE_SERVICE_ROLE_KEY is set.');
    }

    try {
      setLoading(true);
      setError(null);
      
      // Get the current user for logging
      const { data: { user } } = await adminClient.auth.getUser();
      console.log(`[${new Date().toISOString()}] Adding new product by user:`, user?.email || 'unknown');

      // Upload all images first
      const imageUrls = await uploadImages(imageFiles);
      
      // Prepare images array with proper structure
      const productImages = imageUrls.map((url, index) => ({
        url,
        isPrimary: index === 0,
        order: index
      }));
      
      // Calculate original price if not provided
      const originalPrice = product.original_price || (product.offPercentage && product.offPercentage > 0 
        ? Math.round((product.price / (1 - (product.offPercentage / 100))) * 100) / 100 
        : product.price);
      
      // Prepare product data for database
      const productData: any = {
        name: product.name,
        description: product.description,
        price: product.price,
        original_price: originalPrice,
        off_percentage: product.offPercentage || 0,
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

      // Insert into database using admin client
      console.log('Inserting new product with data:', productData);
      const { data, error } = await adminClient
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting product:', error);
        throw new Error(`Failed to add product: ${error.message}`);
      }
      
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
      // Get the admin client for this operation
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client is not available. Make sure VITE_SUPABASE_SERVICE_ROLE_KEY is set.');
      }
      
      setLoading(true);
      setError(null);
      
      // Get the current user for logging
      const { data: { user } } = await adminClient.auth.getUser();
      console.log(`[${new Date().toISOString()}] Updating product ${id} by user:`, user?.email || 'unknown');
      
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
      
      // Calculate original price if not provided but offPercentage is updated
      let originalPrice = updates.original_price;
      if (updates.offPercentage !== undefined || updates.price !== undefined) {
        const currentPrice = updates.price !== undefined ? updates.price : existingProduct.price;
        const currentOffPercentage = updates.offPercentage !== undefined ? updates.offPercentage : (existingProduct.offPercentage || 0);
        
        if (currentOffPercentage > 0) {
          originalPrice = originalPrice || Math.round((currentPrice / (1 - (currentOffPercentage / 100))) * 100) / 100;
        } else if (updates.original_price === undefined && updates.offPercentage === 0) {
          // If discount is removed, set original_price to current price
          originalPrice = currentPrice;
        }
      }
      
      // Prepare updates for Supabase
      const updateData: any = {
        // Always update these fields if they are provided in updates
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.stock !== undefined && { stock_quantity: updates.stock }),
        ...(updates.featured !== undefined && { is_featured: updates.featured }),
        ...(updates.price !== undefined && { price: updates.price }),
        ...(updates.offPercentage !== undefined && { off_percentage: updates.offPercentage }),
        ...(originalPrice !== undefined && { original_price: originalPrice }),
        // Include brand and brand_id if they're in the updates
        ...(updates.brand_id !== undefined && { 
          brand_id: updates.brand_id,
          // Only update the brand name if it's explicitly provided in updates
          ...(updates.brand !== undefined && { brand: updates.brand })
        }),
        ...(updates.price !== undefined && { 
          price: typeof updates.price === 'string' 
            ? (updates.price === '' ? 0 : parseFloat(updates.price) || 0)
            : (updates.price ?? 0)
        }),
        
        // Handle offPercentage with proper type conversion and validation
        ...(updates.offPercentage !== undefined && { 
          off_percentage: typeof updates.offPercentage === 'string'
            ? (updates.offPercentage === '' ? 0 : parseFloat(updates.offPercentage) || 0)
            : (updates.offPercentage ?? 0)
        }),
        
        // Handle original_price if provided
        ...(updates.original_price !== undefined && {
          original_price: typeof updates.original_price === 'string'
            ? (updates.original_price === '' ? null : parseFloat(updates.original_price) || null)
            : (updates.original_price ?? null)
        }),
        
        // Only include specifications if it exists in updates and is not empty
        ...(updates.specifications !== undefined && { 
          specifications: updates.specifications && Object.keys(updates.specifications).length > 0 
            ? updates.specifications 
            : {}
        }),
        // Always update the updated_at timestamp
        updated_at: new Date().toISOString()
      };
      
      // Update the image fields in the update data
      Object.assign(updateData, imageFields);
      
      console.log('Updating product with data:', updateData);
      
      // Update the product in Supabase using the admin client
      console.log('Updating product with data:', updateData);
      const { data: updatedProduct, error: updateError } = await adminClient
        .from('products')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
        
      if (updateError) {
        console.error('Supabase update error:', updateError);
        throw new Error(`Failed to update product: ${updateError.message}`);
      }
      
      console.log('Product updated successfully:', updatedProduct);
      
      // Update the local state with the updated product
      if (updatedProduct) {
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === id ? { ...p, ...updatedProduct } : p)
        );
      }
      
      console.log('Product updated successfully');
      
      
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
      
      // Get the admin client to bypass RLS
      const adminClient = await getAdminClient();
      if (!adminClient) {
        throw new Error('Admin client is not available');
      }
      
      // First, get the product to find all its images using the admin client
      const { data: product, error: fetchError } = await adminClient
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
        
      if (fetchError) throw fetchError;
      
      if (!product) {
        throw new Error('Product not found');
      }
      
      // Collect all image URLs from the product
      const imageUrls: string[] = [];
      
      // Check all possible image URL fields (image_url_1 through image_url_10)
      for (let i = 1; i <= 10; i++) {
        const imageUrl = product[`image_url_${i}` as keyof typeof product];
        if (imageUrl && typeof imageUrl === 'string') {
          imageUrls.push(imageUrl);
        }
      }
      
      // Also include the main image_url if it's different
      if (product.image_url && !imageUrls.includes(product.image_url)) {
        imageUrls.push(product.image_url);
      }
      
      // Delete all associated images from storage using admin client
      if (imageUrls.length > 0) {
        await deleteImages(imageUrls);
      }
      
      // Delete the product from the database using admin client to bypass RLS
      const { error } = await adminClient
        .from('products')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      // Refresh products
      await refreshProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product. ' + (err instanceof Error ? err.message : ''));
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
