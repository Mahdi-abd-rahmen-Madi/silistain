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

export default function ProductForm({ isEditing = false, initialData, productId }: ProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>(initialData || initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { addProduct, updateProduct } = useProducts();
  const navigate = useNavigate();
  const { id } = useParams();

  // Handle file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Filter out any non-image files and limit to max images
    const newImages = files
      .filter(file => file.type.startsWith('image/'))
      .slice(0, MAX_IMAGES - (formData.images?.length || 0));

    const newImagePreviews = newImages.map(file => ({
      url: '',
      file,
      preview: URL.createObjectURL(file),
      isPrimary: false,
      order: (formData.images?.length || 0) + 1
    }));

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...newImagePreviews]
    }));
  };

  // Remove an image
  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...(prev.images || [])];
      // Revoke the object URL to avoid memory leaks
      if (newImages[index]?.preview) {
        URL.revokeObjectURL(newImages[index].preview!);
      }
      newImages.splice(index, 1);
      return { ...prev, images: newImages };
    });
  };

  // Set an image as primary
  const setPrimaryImage = (index: number) => {
    setFormData(prev => {
      const newImages = (prev.images || []).map((img, i) => ({
        ...img,
        isPrimary: i === index
      }));
      return { ...prev, images: newImages };
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
    if (isEditing && initialData) {
      const formattedData = {
        ...initialData,
        // Convert single imageUrl to images array for backward compatibility
        images: initialData.imageUrl 
          ? [{ url: initialData.imageUrl, isPrimary: true, order: 0 }]
          : initialData.images || []
      };
      setFormData(formattedData);
    }
  }, [isEditing, initialData]);

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
    
    if (!formData.name || formData.price <= 0 || (!isEditing && (!formData.images || formData.images.length === 0))) {
      setError('Please fill in all required fields and add at least one image');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      // Process the form data before submission
      const submissionData = {
        ...formData,
        // If no primary image is set, make the first one primary
        images: formData.images?.map((img, index) => ({
          ...img,
          isPrimary: img.isPrimary || index === 0,
          order: index
        }))
      };

      if (isEditing && productId) {
        // For updates, use the first image file if available
        const imageFile = submissionData.images?.find(img => img.file)?.file;
        await updateProduct(
          productId,
          submissionData,
          imageFile // Pass single file or undefined
        );
      } else if (!isEditing) {
        // For new products, require at least one image
        const imageFile = submissionData.images?.find(img => img.file)?.file;
        
        if (!imageFile) {
          throw new Error('At least one image is required');
        }
        
        await addProduct(submissionData, imageFile);
      }
      
      navigate('/admin');
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Failed to save product. Please try again.');
    } finally {
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
