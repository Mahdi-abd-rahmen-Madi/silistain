import { ShoppingCart } from 'lucide-react';
import { Button } from './ui/Button';
import { useToast } from '../hooks/use-toast';

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image: string;
  quantity?: number;
}

interface StickyAddToCartProps {
  product: Product;
  onAddToCart: (product: Product & { quantity: number }) => void;
}

export function StickyAddToCart({ product, onAddToCart }: StickyAddToCartProps) {
  const { toast } = useToast();

  const handleAddToCart = () => {
    onAddToCart({ ...product, quantity: 1 });
    toast({
      title: 'Added to cart',
      description: `${product.brand} ${product.name} has been added to your cart.`,
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">{product.brand} {product.name}</p>
            <p className="text-lg font-bold text-accent">${product.price.toLocaleString()}</p>
          </div>
          <Button 
            size="lg" 
            className="flex-1 max-w-[200px] ml-4"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StickyAddToCart;
