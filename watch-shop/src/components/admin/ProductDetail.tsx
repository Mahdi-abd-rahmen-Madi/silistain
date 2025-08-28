import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { PencilIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { Product } from '../../types/product';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { getProductById } = useProducts();
  const [product, setProduct] = useState<ReturnType<typeof getProductById>>(undefined);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      const productData = getProductById(id);
      setProduct(productData);
      setLoading(false);
    }
  }, [id, getProductById]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
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
    
    return images;
  };
  
  const productImages = product ? getProductImages(product) : [];

  if (!product) {
    return (
      <div className="text-center py-12">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Product not found</h3>
        <p className="mt-1 text-sm text-gray-500">The product you're looking for doesn't exist or has been removed.</p>
        <div className="mt-6">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Product Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details and specifications</p>
        </div>
        <button
          type="button"
          onClick={() => navigate(`/admin/products/edit/${product.id}`)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PencilIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
          Edit
        </button>
      </div>
      <div className="px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Product name</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{product.name}</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-line">
              {product.description || 'No description provided'}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Price</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">${product.price.toFixed(2)}</dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Category</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 capitalize">
              {product.category || 'Uncategorized'}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Stock</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                product.stock || 0 > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.stock || 0} in stock
              </span>
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {product.featured ? (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                  Featured
                </span>
              ) : (
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                  Regular
                </span>
              )}
            </dd>
          </div>
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Images</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {productImages.length > 0 ? (
                <div className="space-y-4">
                  <div className="w-full h-64 bg-gray-100 rounded-md overflow-hidden">
                    <img 
                      src={productImages[selectedImageIndex]?.url} 
                      alt={`${product.name} ${selectedImageIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  {productImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {productImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={`flex-shrink-0 w-16 h-16 border rounded-md overflow-hidden ${
                            selectedImageIndex === index ? 'ring-2 ring-indigo-500' : 'border-gray-200'
                          }`}
                        >
                          <img 
                            src={img.url} 
                            alt={`${product.name} ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center bg-gray-50 rounded-md text-gray-400">
                  No images available
                </div>
              )}
            </dd>
          </div>
          {product.imageUrl && (
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Image</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <div className="border-2 border-gray-100 rounded-md overflow-hidden max-w-xs">
                  <img src={product.imageUrl} alt={product.name} className="w-full h-auto" />
                </div>
              </dd>
            </div>
          )}
        </dl>
      </div>
      <div className="px-4 py-4 bg-gray-50 text-right sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowLeftIcon className="-ml-1 mr-2 h-5 w-5 text-gray-500" aria-hidden="true" />
          Back to Products
        </button>
      </div>
    </div>
  );
}
