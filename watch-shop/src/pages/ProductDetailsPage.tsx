import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../hooks/use-toast';
import { Button } from '../components/ui/Button';
import { ShoppingCart, Truck, Shield, ArrowLeft, Loader2 } from 'lucide-react';
import { Product } from '../types/product';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import FavoriteButton from '../components/FavoriteButton';

const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { products, loading, getProductById } = useProducts();
  const [selectedImage, setSelectedImage] = useState(0);
  
  // Get the product from the context
  const currentProduct = id ? getProductById(id) : null;
  
  // Handle loading and error states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!currentProduct) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <p className="text-gray-600 mt-2">The requested product could not be found.</p>
        <Button onClick={() => navigate('/shop')} className="mt-4">
          Back to Shop
        </Button>
      </div>
    );
  }
  
  // Get all available image URLs from the product
  const getProductImages = (product: Product) => {
    const images = [];
    
    // Check image_url_1 through image_url_5
    for (let i = 1; i <= 5; i++) {
      const imageUrl = product[`image_url_${i}` as keyof Product];
      if (imageUrl && typeof imageUrl === 'string') {
        images.push({
          url: imageUrl,
          isPrimary: i === 1,
          order: i - 1
        });
      }
    }
    
    // Fallback to the main image_url if no other images are found
    if (images.length === 0 && product.imageUrl) {
      images.push({
        url: product.imageUrl,
        isPrimary: true,
        order: 0
      });
    }
    
    // If still no images, use a placeholder
    if (images.length === 0) {
      images.push({
        url: '/placeholder-watch.jpg',
        isPrimary: true,
        order: 0
      });
    }
    
    return images;
  };
  
  const displayImages = getProductImages(currentProduct);

  const handleAddToCart = () => {
    addToCart({ ...currentProduct, quantity: 1 });
    toast({
      title: 'Added to cart',
      description: `"${currentProduct.name}" has been added to your cart.`,
    });
  };


  const handleBuyNow = () => {
    addToCart({ ...currentProduct, quantity: 1 });
    navigate('/checkout');
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/shop')}
        className="mb-8 flex items-center gap-2 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
      >
        <ArrowLeft size={16} /> Back to Products
      </Button>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div>
          <div className="bg-gray-50 rounded-lg overflow-hidden mb-4">
            <img 
              src={displayImages[selectedImage]?.url || '/placeholder-watch.jpg'} 
              alt={currentProduct.name}
              className="w-full h-96 object-contain p-8"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {displayImages.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-16 h-16 border rounded-md overflow-hidden ${
                  selectedImage === index ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <img 
                  src={img.url} 
                  alt={`${currentProduct.name} view ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
        
        {/* Product Info */}
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">{currentProduct.name}</h1>
              <p className="text-2xl font-semibold text-primary mt-2">
                ${currentProduct.price?.toFixed(2)}
              </p>
            </div>
            <FavoriteButton 
              productId={currentProduct.id} 
              productData={{
                id: currentProduct.id,
                name: currentProduct.name,
                price: currentProduct.price,
                imageUrl: currentProduct.imageUrl,
                category: currentProduct.category,
                description: currentProduct.description,
                stock: currentProduct.stock
              }}
            />
          </div>
          
          <div className="mt-6 space-y-4">
            <p className="text-gray-700">{currentProduct.description}</p>
            
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 mt-6">
              <div className="flex items-center gap-2 text-green-700 mb-2">
                <Truck className="w-5 h-5" />
                <span className="font-medium">Free Shipping</span>
              </div>
              <p className="text-sm text-green-700">
                Enjoy free shipping across all 24 governorates in Tunisia.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-5">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Cash on Delivery</span>
              </div>
              <p className="text-sm text-blue-700">
                Pay with cash when your order is delivered. No online payment required.
              </p>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Specifications</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(currentProduct.specifications || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between border-b pb-1">
                    <span className="text-gray-500 capitalize">{key}:</span>
                    <span className="font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-6 space-y-4">
              <Button 
                onClick={handleAddToCart}
                className="w-full py-6 text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart - ${currentProduct.price?.toFixed(2)}
              </Button>
              <Button 
                variant="outline"
                onClick={handleBuyNow}
                className="w-full py-6 text-lg flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary/10 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                Buy Now - ${currentProduct.price?.toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailsPage;
