import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from './ui/Button';
import { toast } from '../hooks/use-toast';
import { Product } from '../types/product';

interface QuickViewProps {
  product: Product & {
    brand?: string;
    rating?: number;
    reviewCount?: number;
    isNew?: boolean;
    isBestSeller?: boolean;
    availableSizes?: string[];
    colors?: Array<{ name: string; class: string; selectedClass: string }>;
  };
  onAddToCart: (product: Product & { quantity: number }) => void;
}

export function QuickView({ product, onAddToCart }: QuickViewProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedImage, setSelectedImage] = React.useState(0);
  const [quantity, setQuantity] = React.useState(1);
  const [selectedSize, setSelectedSize] = React.useState(
    product.availableSizes?.[0] || ''
  );
  const [selectedColor, setSelectedColor] = React.useState(
    product.colors?.[0]?.name || ''
  );
  const [isWishlisted, setIsWishlisted] = React.useState(false);

  const handleAddToCart = () => {
    onAddToCart({ ...product, quantity });
    setOpen(false);
    toast({
      title: 'Added to cart',
      description: `${product.brand} ${product.name} has been added to your cart.`,
    });
  };

  const toggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast({
      title: !isWishlisted ? 'Added to wishlist' : 'Removed from wishlist',
      description: !isWishlisted 
        ? `${product.brand} ${product.name} has been added to your wishlist.`
        : `${product.brand} ${product.name} has been removed from your wishlist.`,
    });
  };

  // Get the first image URL for the main display
  const mainImageUrl = product.images?.[0]?.url || product.imageUrl || '/placeholder-watch.jpg';
  
  // Use description as features if available, otherwise default empty array
  const features = product.description ? [product.description] : [];

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" size="sm" className="mt-2 w-full">
          Quick View
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content 
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-4xl translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
          onEscapeKeyDown={(e) => e.preventDefault()}
          onPointerDownOutside={(e) => e.preventDefault()}
        >
            {/* Product Images */}
            <div className="relative p-6">
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-50">
                <img
                  src={mainImageUrl}
                  alt={product.name}
                  className="h-full w-full object-cover object-center"
                />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-md ${
                        selectedImage === index ? 'ring-2 ring-accent' : ''
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <img
                        src={img.url}
                        alt={`${product.name} - ${index + 1}`}
                        className="h-full w-full object-cover object-center"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="relative">
              <Dialog.Close className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </Dialog.Close>

              <div className="space-y-4">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold">{product.brand}</h2>
                  <h3 className="text-xl font-medium">{product.name}</h3>
                  <div className="flex items-center">
                    {product.rating && (
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= Math.round(product.rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                            fill="currentColor"
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {product.rating?.toFixed(1)} ({product.reviewCount || 0} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-accent">
                    ${product.price.toFixed(2)}
                  </p>
                </div>

                {product.description && (
                  <div className="prose prose-sm max-w-none">
                    <p>{product.description}</p>
                  </div>
                )}

                {product.colors && product.colors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium">Color: {selectedColor}</h4>
                    <div className="mt-2 flex space-x-2">
                      {product.colors.map((color) => (
                        <button
                          key={color.name}
                          type="button"
                          className={`h-8 w-8 rounded-full ${color.class} ${
                            selectedColor === color.name ? 'ring-2 ring-offset-2 ring-accent' : ''
                          }`}
                          onClick={() => setSelectedColor(color.name)}
                        >
                          <span className="sr-only">{color.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {product.availableSizes && product.availableSizes.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium">Size</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.availableSizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className={`px-3 py-1 border rounded-md text-sm ${
                            selectedSize === size
                              ? 'bg-accent text-white border-accent'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {features.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium">Features</h4>
                    <ul className="mt-2 space-y-1 text-sm">
                      {features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center">
                          <svg
                            className="h-4 w-4 text-accent mr-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center space-x-4 pt-4">
                  <div className="flex items-center border rounded-md">
                    <button
                      type="button"
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 focus:outline-none"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      -
                    </button>
                    <span className="px-3 py-2 w-12 text-center">{quantity}</span>
                    <button
                      type="button"
                      className="px-3 py-2 text-gray-600 hover:text-gray-800 focus:outline-none"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <Button
                    onClick={handleAddToCart}
                    className="flex-1 bg-accent hover:bg-accent-dark text-white"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Add to Cart
                  </Button>
                  <button
                    onClick={toggleWishlist}
                    className="p-2 rounded-full hover:bg-gray-100"
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400'
                      }`}
                      strokeWidth={isWishlisted ? 0 : 1.5}
                    />
                  </button>
                </div>
              </div>
            </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default QuickView;
