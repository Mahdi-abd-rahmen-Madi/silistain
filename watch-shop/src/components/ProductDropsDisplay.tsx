import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button } from './ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { useNavigate } from 'react-router-dom';

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  images: string[];
  specifications: Record<string, any>;
  position: number;
};

type ProductDrop = {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_active: boolean;
};

export const ProductDropsDisplay = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentDrop, setCurrentDrop] = useState<ProductDrop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchActiveDrop = async () => {
      try {
        // First, get the active drop
        const { data: dropData, error: dropError } = await supabase
          .rpc('get_active_drop')
          .single();

        if (dropError) throw dropError;
        
        if (dropData) {
          setCurrentDrop(dropData as ProductDrop);
          
          // Then get products for this drop
          const { data: productsData, error: productsError } = await supabase
            .rpc('get_products_in_active_drop');
            
          if (productsError) throw productsError;
          
          setProducts((productsData as Product[]) || []);
        }
      } catch (error) {
        console.error('Error fetching active drop:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActiveDrop();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader>
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!currentDrop || products.length === 0) {
    return null; // Don't render anything if there's no active drop or products
  }

  return (
    <section className="py-12 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentDrop.name}</h2>
          {currentDrop.description && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {currentDrop.description}
            </p>
          )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={product.images?.[0] || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="object-cover w-full h-full hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/placeholder-product.jpg';
                  }}
                />
              </div>
              <CardHeader>
                <CardTitle className="text-lg">{product.name}</CardTitle>
                <CardDescription className="text-base font-medium">
                  {product.brand}
                </CardDescription>
                <div className="text-lg font-bold">${product.price.toFixed(2)}</div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => navigate(`/product/${product.id}`)}
                >
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductDropsDisplay;
