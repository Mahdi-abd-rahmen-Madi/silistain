import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeftIcon, ShoppingCartIcon, TruckIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import watches from '../data/watches';
import { Watch } from '../types';
import FavoriteButton from '../components/FavoriteButton';

type TabType = 'description' | 'specs' | 'shipping' | 'reviews';

const WatchDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [watch, setWatch] = useState<Watch | null>(null);
  const [selectedImage, setSelectedImage] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedTab, setSelectedTab] = useState<TabType>('description');

  // Find the watch by ID
  useEffect(() => {
    if (!id) {
      navigate('/shop');
      return;
    }
    
    const foundWatch = watches.find(w => w.id === id);
    
    if (!foundWatch) {
      navigate('/shop');
      return;
    }
    
    setWatch(foundWatch);
    setSelectedImage(0);
  }, [id, navigate]);

  const getImageUrl = (image: string | { url: string }) => {
    return typeof image === 'string' ? image : image.url;
  };

  if (!watch) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!watch) return;
    // Add to cart functionality will be implemented later
    console.log(`Added ${quantity} ${watch.brand} ${watch.name} to cart`);
  };

  const increaseQuantity = () => {
    if (!watch) return;
    if (quantity < watch.inStock) {
      setQuantity(prev => prev + 1);
    }
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-accent mb-6 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Shop
        </button>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Image Gallery */}
            <div>
              {/* Main Image */}
              <div className="bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden mb-4 h-96 flex items-center justify-center">
                <img
                  src={watch.images ? getImageUrl(watch.images[selectedImage]) : getImageUrl(watch.image)}
                  alt={`${watch.brand} ${watch.name}`}
                  className="h-full w-full object-contain"
                />
              </div>

              {/* Thumbnails */}
              {watch.images && watch.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {[watch.image, ...(watch.images || [])].map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`h-20 rounded-md overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? 'border-accent ring-2 ring-accent ring-opacity-50'
                          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <img
                        src={getImageUrl(img)}
                        alt={`${watch.brand} ${watch.name} - View ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="pt-4">
              {/* Brand and Name */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{watch.brand} {watch.name}</h1>
                  <p className="text-2xl text-gray-900 mt-2">${watch.price.toFixed(2)}</p>
                </div>
                <FavoriteButton productId={watch.id.toString()} className="mt-1" />
              </div>

              {/* Price */}
              <div className="mt-4">
                <span className="text-2xl font-bold text-accent">${watch.price.toLocaleString()}</span>
                {watch.inStock > 0 ? (
                  <span className="ml-3 text-sm text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    In Stock ({watch.inStock} available)
                  </span>
                ) : (
                  <span className="ml-3 text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded-full">
                    Out of Stock
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mt-6 text-gray-600 dark:text-gray-300">{watch.description}</p>

              {/* Specifications */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(watch.specifications).map(([key, value]) => (
                    <div key={key} className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className="font-medium text-gray-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features */}
              {watch.features && watch.features.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">Features</h3>
                  <ul className="space-y-2">
                    {watch.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0"
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
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Add to Cart */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                {watch.inStock > 0 ? (
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                      <button
                        onClick={decreaseQuantity}
                        disabled={quantity <= 1}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        -
                      </button>
                      <span className="px-4 py-2 text-center w-12">{quantity}</span>
                      <button
                        onClick={increaseQuantity}
                        disabled={quantity >= watch.inStock}
                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 bg-accent hover:bg-accent-dark text-white font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <ShoppingCartIcon className="h-5 w-5 mr-2" />
                      Add to Cart - ${(watch.price * quantity).toLocaleString()}
                    </button>
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full bg-gray-300 dark:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200 dark:border-gray-700 mt-8">
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setSelectedTab('description')}
                className={`py-4 px-6 font-medium text-sm ${
                  selectedTab === 'description'
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setSelectedTab('specs')}
                className={`py-4 px-6 font-medium text-sm ${
                  selectedTab === 'specs'
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Specifications
              </button>
              <button
                onClick={() => setSelectedTab('shipping')}
                className={`py-4 px-6 font-medium text-sm ${
                  selectedTab === 'shipping'
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                Shipping & Returns
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {selectedTab === 'description' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Product Description</h3>
                  <p className="text-gray-600 dark:text-gray-300">{watch.description}</p>
                  {watch.features && watch.features.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Key Features</h4>
                      <ul className="list-disc pl-5 space-y-2">
                        {watch.features.map((feature, index) => (
                          <li key={index} className="text-gray-600 dark:text-gray-300">
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {selectedTab === 'specs' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Technical Specifications</h3>
                  <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {Object.entries(watch.specifications).map(([key, value]) => (
                          <tr key={key} className="bg-white dark:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white capitalize">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedTab === 'shipping' && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping & Returns</h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Shipping</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        We offer worldwide shipping. Most orders are processed within 1-2 business days and delivered within 3-7 business days, depending on your location. You will receive a tracking number once your order has shipped.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Returns</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        We offer a 30-day return policy. If you're not completely satisfied with your purchase, you may return it in its original condition for a full refund. Please contact our customer service team to initiate a return.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">Warranty</h4>
                      <p className="text-gray-600 dark:text-gray-300">
                        All our watches come with a 2-year international warranty covering manufacturing defects. The warranty does not cover damage caused by accidents, misuse, or normal wear and tear.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {watches
              .filter(w => w.id !== watch.id && w.category === watch.category)
              .slice(0, 4)
              .map(relatedWatch => (
                <motion.div
                  key={relatedWatch.id}
                  whileHover={{ y: -5 }}
                  className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300"
                >
                  <Link to={`/watch/${relatedWatch.id}`} className="block">
                    <div className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center p-4">
                      <img
                        src={relatedWatch.image}
                        alt={`${relatedWatch.brand} ${relatedWatch.name}`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {relatedWatch.brand}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{relatedWatch.name}</p>
                      <p className="text-accent font-bold mt-2">
                        ${relatedWatch.price.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WatchDetails;
