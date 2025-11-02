import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Product, ProductImage } from '../../types/product';
import { ProductCard } from '../../components/ProductCard';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../hooks/use-toast';

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<{
    id: string;
    name: string;
    slug: string;
    description?: string;
    image_url?: string;
    is_active: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = useCallback((product: Product) => {
    addToCart({
      ...product,
      quantity: 1,
      price: Number(product.price) || 0,
      image: product.image_url || product.imageUrl || '',
      stock_quantity: product.stock_quantity || 0,
      is_featured: product.is_featured || false,
    });
    
    toast({
      title: t('cart.added_to_cart'),
      description: `${product.name} ${t('cart.has_been_added')}`,
    });
  }, [addToCart, t, toast]);

  useEffect(() => {
    const fetchCategoryAndProducts = async () => {
      if (!slug) return;

      try {
        setLoading(true);
        
        // Fetch category by slug
        const { data: categoryData, error: categoryError } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (categoryError) throw categoryError;
        if (!categoryData) {
          // Category not found or not active
          setCategory(null);
          setProducts([]);
          return;
        }
        
        setCategory(categoryData);

        // Fetch products in this category
        // First get the category name from the slug
        const categoryName = categoryData.name;
        
        // Then fetch products that have this category name in their category field
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('category', categoryName)
          .order('created_at', { ascending: false });
          
        console.log('Products for category', categoryName, ':', productsData);

        if (productsError) throw productsError;
        setProducts(productsData || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryAndProducts();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">{t('category.not_found')}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{category.name}</h1>
          {products.length > 0 && (
            <p className="text-gray-500 mt-2">
              {products.length} {products.length === 1 ? 'product' : 'products'} in this category
            </p>
          )}
        </div>
      </div>
      
      {category.description && (
        <div className="mb-8 text-gray-600">
          <p>{category.description}</p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">{t('category.no_products')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            // Create a properly typed images array
            const images: ProductImage[] = [];
            
            // Helper function to add image if it exists
            const addImage = (url: string | null | undefined, isPrimary = false) => {
              if (url) {
                images.push({
                  url,
                  isPrimary,
                  alt: product.name || 'Product image'
                });
              }
            };

            // Add all available images
            addImage(product.image_url, true);
            addImage(product.image_url_1);
            addImage(product.image_url_2);
            addImage(product.image_url_3);
            addImage(product.image_url_4);
            addImage(product.image_url_5);

            // Ensure we have at least one image
            if (images.length === 0) {
              images.push({
                url: '/placeholder-product.jpg',
                alt: 'No image available',
                isPrimary: true
              });
            }

            return (
              <ProductCard 
                key={product.id}
                product={{
                  ...product,
                  images,
                  stock_quantity: product.stock_quantity || 0,
                  is_featured: product.is_featured || false,
                  price: Number(product.price) || 0,
                  original_price: product.original_price ? Number(product.original_price) : undefined,
                  offPercentage: product.off_percentage ? Number(product.off_percentage) : undefined,
                }}
                onAddToCart={handleAddToCart}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
