import { createContext, useContext, useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Product } from '../types/product';

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, imageFile: File) => Promise<void>;
  updateProduct: (id: string, updates: Partial<Product>, imageFile?: File) => Promise<void>;
  deleteProduct: (id: string, imageUrl: string) => Promise<void>;
  getProductById: (id: string) => Product | undefined;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function useProducts() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const q = query(productsRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const productsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          price: Number(doc.data().price),
          stock: Number(doc.data().stock),
          featured: Boolean(doc.data().featured),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
        })) as Product[];
        
        setProducts(productsData);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use relative path for Vercel deployment
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload image: ${error}`);
      }

      const { url } = await response.json();
      if (!url) {
        throw new Error('No URL returned from server');
      }

      return url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const deleteImage = async (imageUrl: string) => {
    // Note: Vercel Blob doesn't support direct deletion from client-side
    // You would need to create a separate API endpoint for deletion
    console.log('Image deletion not implemented. Image URL:', imageUrl);
  };

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>, imageFile: File) => {
    try {
      setLoading(true);
      const imageUrl = await uploadImage(imageFile);
      const now = Timestamp.now();
      
      const docRef = await addDoc(collection(db, 'products'), {
        ...product,
        imageUrl,
        price: Number(product.price),
        stock: Number(product.stock),
        featured: Boolean(product.featured),
        createdAt: now,
        updatedAt: now,
      });

      setProducts(prev => [{
        ...product,
        id: docRef.id,
        imageUrl,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      }, ...prev]);
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
      setLoading(true);
      const productRef = doc(db, 'products', id);
      const now = Timestamp.now();
      
      let imageUrl = updates.imageUrl;
      if (imageFile) {
        // Delete old image if it exists and is being replaced
        if (updates.imageUrl) {
          await deleteImage(updates.imageUrl);
        }
        imageUrl = await uploadImage(imageFile);
      }

      await updateDoc(productRef, {
        ...updates,
        ...(imageFile && { imageUrl }),
        price: updates.price ? Number(updates.price) : undefined,
        stock: updates.stock ? Number(updates.stock) : undefined,
        featured: updates.featured ? Boolean(updates.featured) : undefined,
        updatedAt: now,
      });

      setProducts(prev => prev.map(product => 
        product.id === id 
          ? { 
              ...product, 
              ...updates, 
              ...(imageFile && { imageUrl }),
              updatedAt: now.toDate(),
            } 
          : product
      ));
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Failed to update product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string, imageUrl: string) => {
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'products', id));
      await deleteImage(imageUrl);
      
      setProducts(prev => prev.filter(product => product.id !== id));
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getProductById = (id: string) => {
    return products.find(product => product.id === id);
  };

  const value = {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    getProductById,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}
