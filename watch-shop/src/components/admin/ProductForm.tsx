import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { Product, ProductImage } from '../../types/product';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';

type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & {
  images?: (ProductImage & { file?: File; preview?: string })[];
};

const MAX_IMAGES = 5;

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  category: '',
  stock: 0,
  featured: false,
  images: [],
};

interface ProductFormProps {
  isEditing?: boolean;
  initialData?: ProductFormData;
  productId?: string;
}

export default function ProductForm({
  isEditing = false,
  initialData,
  productId: propProductId,
}: ProductFormProps) {
  // Destructure productId from props and rename to avoid naming conflicts
  const effectiveProductId = propProductId;
  const [formData, setFormData] = useState<ProductFormData>(initialData || initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { 
    addProduct, 
    updateProduct, 
    getProductById, 
    refreshProducts, 
    products = [] 
  } = useProducts();
  
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  
  // Use the effectiveProductId from props or params, with props taking precedence
  const productId = effectiveProductId || paramId || '';

  // Handle file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter out any non-image files and limit to max images
    const newImages = files
      .filter(file => file.type.startsWith('image/'))
      .slice(0, MAX_IMAGES - (formData.images?.length || 0));

    const newImagePreviews = newImages.map((file, index) => ({
      url: '',
      file,
      preview: URL.createObjectURL(file),
      isPrimary: (formData.images?.length || 0) === 0 && index === 0, // First image is primary by default
      order: (formData.images?.length || 0) + index
    }));

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...newImagePreviews].map((img, idx) => ({
        ...img,
        order: idx // Ensure order is sequential
      }))
    }));

    // Reset file input to allow selecting the same file again
    e.target.value = '';
  };

  // Remove an image
  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...(prev.images || [])];
      // Revoke the object URL to avoid memory leaks
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview!);
      }
      
      const isRemovingPrimary = newImages[index]?.isPrimary;
      newImages.splice(index, 1);
      
      // If we removed the primary image, set the first remaining image as primary
      if (isRemovingPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }
      
      return { 
        ...prev, 
        images: newImages,
        // Update imageUrl if we removed the primary image
        imageUrl: isRemovingPrimary && newImages.length > 0 
          ? (newImages[0].preview || newImages[0].url) 
          : prev.imageUrl
      };
    });
  };

  // Set an image as primary
  const setPrimaryImage = (index: number) => {
    setFormData(prev => {
      const newImages = (prev.images || []).map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
      
      // If this is a new image that hasn't been uploaded yet, update the imageUrl
      const newImageUrl = newImages[index]?.preview || newImages[index]?.url;
      return { 
        ...prev, 
        images: newImages,
        imageUrl: newImageUrl || prev.imageUrl
      };
    });
  };

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      formData.images?.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, []);

  // Load product data if in edit mode
  useEffect(() => {
    const loadProduct = async () => {
      if (!isEditing || !productId) {
        if (initialData) {
          setFormData({
            ...initialData,
            images: initialData.imageUrl 
              ? [{ 
                  url: initialData.imageUrl, 
                  isPrimary: true, 
                  order: 0,
                  preview: initialData.imageUrl
                }]
              : initialData.images || []
          });
        }
        return;
      }

      try {
        console.log('Loading product with ID:', productId);
        console.log('Current products in context:', products.length);
        
        // First try to get from context
        let product = getProductById(productId);
        console.log('Product from context:', product ? 'Found' : 'Not found');
        
        // If not found in context, try to refresh
        if (!product) {
          console.log('Product not found in context, refreshing products...');
          try {
            const refreshedProducts = await refreshProducts();
            console.log('Refreshed products count:', refreshedProducts.length);
            product = getProductById(productId);
            console.log('Product after refresh:', product ? 'Found' : 'Still not found');
          } catch (refreshError) {
            console.error('Failed to refresh products:', refreshError);
            throw new Error(`Failed to load product data: ${refreshError instanceof Error ? refreshError.message : 'Unknown error'}`);
          }
        }
        
        // If still not found, show detailed error
        if (!product) {
          const availableIds = products?.map((p: Product) => p.id) || [];
          throw new Error(`Product with ID ${productId} not found. Available IDs: ${availableIds.join(', ') || 'None'}`);
        }
        
        // Handle images - support multiple image URLs (image_url_1 through image_url_5) and legacy imageUrl/fields
        let images: ProductImage[] = [];
        
        // Get all image URLs from the product
        const imageUrls = [
          product.image_url_1,
          product.image_url_2,
          product.image_url_3,
          product.image_url_4,
          product.image_url_5
        ].filter(Boolean) as string[];
        
        // If we have no image URLs but have a legacy imageUrl, use that
        if (imageUrls.length === 0 && product.imageUrl) {
          imageUrls.push(product.imageUrl);
        }
        
        // Create image objects from the URLs
        images = imageUrls.map((url, index) => ({
          url,
          isPrimary: index === 0, // First image is primary by default
          order: index,
          preview: url
        }));
        
        // If we also have an images array, merge them (excluding duplicates)
        if (Array.isArray(product.images) && product.images.length > 0) {
          const existingUrls = new Set(images.map(img => img.url));
          let order = images.length;
          
          product.images.forEach(img => {
            if (img.url && !existingUrls.has(img.url)) {
              images.push({
                ...img,
                preview: img.preview || img.url,
                order: order++,
                isPrimary: img.isPrimary || false
              });
            }
          });
        } else if (images.length === 0 && product.imageUrl) {
          // If we still have no images, use the legacy imageUrl if it exists
          images = [{
            url: product.imageUrl,
            isPrimary: true,
            order: 0,
            preview: product.imageUrl
          }];
        }
        
        const formattedData: ProductFormData = {
          ...product,
          images,
          // Ensure all required fields have default values
          name: product.name || '',
          description: product.description || '',
          price: product.price || 0,
          category: product.category || '',
          stock: product.stock || product.stock_quantity || 0,
          featured: product.featured || false
        };
        
        console.log('Formatted product data:', formattedData);
        setFormData(formattedData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load product data';
        console.error('Error loading product:', errorMessage, err);
        setError(errorMessage);
      }
    };
    
    loadProduct();
    // Include all dependencies that are used in the effect
  }, [isEditing, productId, initialData, getProductById, refreshProducts, products]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const newImages = Array.from(files).map(file => ({
          url: '',
          file,
          preview: URL.createObjectURL(file),
          isPrimary: false,
          order: formData.images?.length || 0
        }));
        
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...newImages].slice(0, MAX_IMAGES)
        }));
      }
    } else if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.price <= 0) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      console.log('[ProductForm] Starting form submission...');
      setIsSubmitting(true);
      setError('');

      // Process the form data before submission
      const submissionData = {
        ...formData,
        // Ensure images have proper order and primary flag
        images: formData.images?.map((img, index) => ({
          ...img,
          isPrimary: img.isPrimary || index === 0,
          order: index
        }))
      };

      console.log('[ProductForm] Prepared submission data:', {
        ...submissionData,
        images: submissionData.images?.map(img => ({
          ...img,
          file: img.file ? `[File: ${img.file.name}]` : undefined,
          preview: img.preview ? '[Preview URL]' : undefined
        }))
      });

      // Get all image files to upload
      const imageFiles = submissionData.images
        ?.filter(img => img.file)
        .map(img => img.file) as File[] || [];

      if (isEditing && productId) {
        console.log(`[ProductForm] Updating product with ID: ${productId}`);
        console.log(`[ProductForm] Found ${imageFiles.length} new image files for update`);
        
        try {
          console.log('[ProductForm] Calling updateProduct...');
          await updateProduct(productId, submissionData, imageFiles);
          console.log('[ProductForm] updateProduct completed successfully');
        } catch (updateError) {
          console.error('[ProductForm] Error in updateProduct:', updateError);
          throw updateError;
        }
      } else {
        console.log('[ProductForm] Creating new product');
        
        if (imageFiles.length === 0) {
          const errorMsg = 'At least one image is required';
          console.error('[ProductForm]', errorMsg);
          throw new Error(errorMsg);
        }
        
        console.log(`[ProductForm] Calling addProduct with ${imageFiles.length} images`);
        await addProduct(submissionData, imageFiles);
      }
      
      console.log('[ProductForm] Navigation to /admin');
      navigate('/admin');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ProductForm] Error saving product:', errorMessage, err);
      setError(`Failed to save product: ${errorMessage}`);
    } finally {
      console.log('[ProductForm] Setting isSubmitting to false');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-semibold mb-6">
        {isEditing ? 'Edit Product' : 'Add New Product'}
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Price */}
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">
              Price <span className="text-red-500">*</span>
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="price"
                name="price"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                className="pl-7 block w-full rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
              Stock
            </label>
            <input
              type="number"
              id="stock"
              name="stock"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              <option value="dress">Dress Watches</option>
              <option value="sports">Sports Watches</option>
              <option value="diving">Diving Watches</option>
              <option value="smart">Smart Watches</option>
              <option value="luxury">Luxury Watches</option>
            </select>
          </div>

          {/* Featured */}
          <div className="flex items-center">
            <input
              id="featured"
              name="featured"
              type="checkbox"
              checked={formData.featured}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
              Featured Product
            </label>
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Images <span className="text-red-500">*</span>
            <span className="text-xs text-gray-500 ml-2">
              (Max {MAX_IMAGES} images, first one will be primary)
            </span>
          </label>
          
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Existing images */}
            {formData.images?.map((img, index) => (
              <div key={index} className="relative group">
                <div className={`relative aspect-square rounded-md overflow-hidden border-2 ${img.isPrimary ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-200'}`}>
                  <img
                    src={img.preview || img.url}
                    alt={`Product ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => setPrimaryImage(index)}
                      className={`p-1 rounded-full ${img.isPrimary ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700'} m-1`}
                      title={img.isPrimary ? 'Primary image' : 'Set as primary'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        {img.isPrimary ? (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        ) : (
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 100 2h3a3 3 0 003-3v-3a1 1 0 00-1-1z" clipRule="evenodd" />
                        )}
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1 rounded-full bg-red-500 text-white m-1"
                      title="Remove image"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {img.isPrimary && (
                  <div className="absolute -top-2 -right-2 bg-indigo-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                    Primary
                  </div>
                )}
              </div>
            ))}

            {/* Add more images button */}
            {(formData.images?.length || 0) < MAX_IMAGES && (
              <div className="aspect-square">
                <label className="h-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-indigo-500 hover:bg-gray-50 transition-colors">
                  <PhotoIcon className="h-8 w-8 text-gray-400" />
                  <span className="mt-2 text-sm text-gray-600">
                    Add {MAX_IMAGES - (formData.images?.length || 0)} more
                  </span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={(formData.images?.length || 0) >= MAX_IMAGES}
                  />
                </label>
              </div>
            )}
          </div>
          
          {formData.images && formData.images.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Click on an image to set as primary. First image will be used as the main product image.
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Adding...'}
              </>
            ) : isEditing ? (
              'Update Product'
            ) : (
              'Add Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
