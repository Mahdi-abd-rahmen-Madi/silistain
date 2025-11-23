import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { Product, ProductImage } from '../../types/product';
import { PhotoIcon, XMarkIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { supabase } from '../../lib/supabaseClient';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  created_at: string;
}

interface BrandOption {
  id: string;
  name: string;
}

type ProductFormData = Omit<Product, 'id' | 'createdAt' | 'updatedAt'> & {
  images?: (ProductImage & { file?: File; preview?: string })[];
};

const MAX_IMAGES = 10;

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  offPercentage: 0,
  category: '',
  brand: '',
  brand_id: '',
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
  const effectiveProductId = propProductId;
  const [formData, setFormData] = useState<ProductFormData>(initialData || initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  const { 
    addProduct, 
    updateProduct, 
    getProductById, 
    refreshProducts, 
    products = [] 
  } = useProducts();
  
  const navigate = useNavigate();
  const { id: paramId } = useParams<{ id: string }>();
  const productId = effectiveProductId || paramId || '';

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setIsLoadingCategories(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // Fetch brands
  const fetchBrands = useCallback(async () => {
    try {
      setIsLoadingBrands(true);
      const { data, error } = await supabase
        .from('brands')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name', { ascending: true });
      
      if (error) throw error;
      
      const brandOptions = data.map(brand => ({
        id: brand.id,
        name: brand.name
      }));
      
      setBrands(brandOptions);
    } catch (err) {
      console.error('Error fetching brands:', err);
      setError('Failed to load brands');
    } finally {
      setIsLoadingBrands(false);
    }
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
        let product = getProductById(productId);
        
        if (!product) {
          const refreshedProducts = await refreshProducts();
          product = getProductById(productId);
        }
        
        if (!product) {
          const availableIds = products?.map((p: Product) => p.id) || [];
          throw new Error(`Product with ID ${productId} not found. Available IDs: ${availableIds.join(', ') || 'None'}`);
        }
        
        // Handle images
        let images: ProductImage[] = [];
        const imageUrls = [
          product.image_url_1,
          product.image_url_2,
          product.image_url_3,
          product.image_url_4,
          product.image_url_5,
        ].filter((url): url is string => Boolean(url));

        if (imageUrls.length > 0) {
          images = imageUrls.map((url, index) => ({
            url,
            isPrimary: index === 0,
            order: index,
            preview: url
          }));
        } else if (product.imageUrl) {
          images = [{
            url: product.imageUrl,
            isPrimary: true,
            order: 0,
            preview: product.imageUrl
          }];
        }
        
        // Get category name
        const { data: latestCategories } = await supabase
          .from('categories')
          .select('id, name')
          .eq('is_active', true);
          
        const categoryName = latestCategories?.find(cat => 
          cat.id === product.category || cat.name === product.category
        )?.name || product.category;
        
        const formattedData: ProductFormData = {
          ...product,
          images,
          name: product.name || '',
          description: product.description || '',
          price: product.price || 0,
          offPercentage: product.offPercentage || 0,
          category: categoryName || '',
          brand: product.brand || '',
          brand_id: product.brand_id || '',
          stock: product.stock || product.stock_quantity || 0,
          featured: product.featured || false
        };
        
        setFormData(formattedData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load product data';
        console.error('Error loading product:', errorMessage, err);
        setError(errorMessage);
      }
    };
    
    loadProduct();
    fetchCategories();
    fetchBrands();
  }, [isEditing, productId, initialData, getProductById, refreshProducts, products, fetchCategories, fetchBrands]);

  // ✅ NEW: Sync selectedBrand whenever formData or brands change
  useEffect(() => {
    if (!isEditing || brands.length === 0) {
      // For new products, reset when brands load
      if (!isEditing && initialData?.brand_id && brands.some(b => b.id === initialData.brand_id)) {
        setSelectedBrand(initialData.brand_id);
      }
      return;
    }

    // Priority 1: Use brand_id if available and valid
    if (formData.brand_id && brands.some(b => b.id === formData.brand_id)) {
      setSelectedBrand(formData.brand_id);
      return;
    }

    // Priority 2: Match by brand name
    if (formData.brand) {
      const found = brands.find(b => b.name === formData.brand);
      if (found) {
        setSelectedBrand(found.id);
        return;
      }
    }

    // Clear selection if no match
    setSelectedBrand('');
  }, [formData.brand, formData.brand_id, brands, isEditing, initialData]);

  // Handle image changes
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files
      .filter(file => file.type.startsWith('image/'))
      .slice(0, MAX_IMAGES - (formData.images?.length || 0));

    const newImagePreviews = newImages.map((file, index) => ({
      url: '',
      file,
      preview: URL.createObjectURL(file),
      isPrimary: (formData.images?.length || 0) === 0 && index === 0,
      order: (formData.images?.length || 0) + index
    }));

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...newImagePreviews].map((img, idx) => ({
        ...img,
        order: idx
      }))
    }));
  };

  // Remove image
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  // Set primary image
  const setPrimaryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.map((img, i) => ({
        ...img,
        isPrimary: i === index
      })) || []
    }));
  };

  // Cleanup previews
  useEffect(() => {
    return () => {
      formData.images?.forEach(img => {
        if (img.preview) {
          URL.revokeObjectURL(img.preview);
        }
      });
    };
  }, [formData.images]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: target.checked,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
      }));
    }
  };

  // Handle brand selection
  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const brandId = e.target.value;
    const brand = brands.find(b => b.id === brandId);
    
    if (brand) {
      setSelectedBrand(brand.id);
      setFormData(prev => ({
        ...prev,
        brand: brand.name,
        brand_id: brand.id
      }));
    } else {
      setSelectedBrand('');
      setFormData(prev => ({
        ...prev,
        brand: '',
        brand_id: ''
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
      setIsSubmitting(true);
      setError('');

      const selectedBrandData = brands.find(brand => brand.id === selectedBrand);
      
      const submissionData = {
        ...formData,
        brand_id: selectedBrand,
        brand: selectedBrandData?.name || formData.brand,
        images: formData.images?.map((img, index) => ({
          ...img,
          isPrimary: img.isPrimary || index === 0,
          order: index
        }))
      };

      const imageFiles = submissionData.images
        ?.filter(img => img.file)
        .map(img => img.file) as File[] || [];

      if (isEditing && productId) {
        await updateProduct(productId, submissionData, imageFiles);
      } else {
        if (imageFiles.length === 0) {
          throw new Error('At least one image is required');
        }
        await addProduct(submissionData, imageFiles);
      }
      
      navigate('/admin');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('[ProductForm] Error saving product:', errorMessage, err);
      setError(`Failed to save product: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 px-2 sm:px-0">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {isEditing ? 'Update the product details below.' : 'Fill in the details to add a new product.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4 sm:space-y-6">
          {/* Basic Information */}
          <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Basic Information</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">Basic details about the product.</p>
            </div>

            <div className="space-y-4 sm:grid sm:grid-cols-6 sm:gap-4 sm:space-y-0">
              <div className="sm:col-span-6 md:col-span-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm sm:text-base"
                  required
                />
              </div>

              <div className="sm:col-span-3 md:col-span-2">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm sm:text-base">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm sm:text-base"
                    required
                  />
                </div>
              </div>

              <div className="sm:col-span-3 md:col-span-2">
                <label htmlFor="offPercentage" className="block text-sm font-medium text-gray-700">
                  Discount (%)
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    id="offPercentage"
                    name="offPercentage"
                    value={formData.offPercentage || ''}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm sm:text-base"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-sm sm:text-base">%</span>
                  </div>
                </div>
                {formData.offPercentage > 0 && formData.price > 0 && (
                  <p className="mt-1 text-sm text-green-600">
                    Discounted Price: ${(formData.price * (1 - (formData.offPercentage / 100))).toFixed(2)}
                  </p>
                )}
              </div>

              <div className="sm:col-span-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm sm:text-base"
                  />
                </div>
              </div>

              <div className="sm:col-span-6 md:col-span-3">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-sm sm:text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 focus:ring-offset-2"
                  disabled={isLoadingCategories}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {isLoadingCategories && (
                  <p className="mt-1 text-xs text-gray-500">Loading categories...</p>
                )}
                {!isLoadingCategories && categories.length === 0 && (
                  <p className="mt-1 text-xs text-gray-500">No categories found. Please add categories first.</p>
                )}
                {formData.category && !categories.some(cat => cat.name === formData.category) && (
                  <p className="mt-1 text-xs text-yellow-600">
                    Category "{formData.category}" not found in the list. It will be saved as a new category.
                  </p>
                )}
              </div>

              <div className="sm:col-span-6 md:col-span-3">
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                  Brand
                </label>
                <div className="mt-1">
                  <select
                    id="brand"
                    name="brand"
                    value={selectedBrand}
                    onChange={handleBrandChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    disabled={isLoadingBrands}
                  >
                    <option value="">Select a brand</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                  {isLoadingBrands && (
                    <p className="mt-1 text-xs text-gray-500">Loading brands...</p>
                  )}
                  {!isLoadingBrands && brands.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">No brands found. Please add brands first.</p>
                  )}
                </div>
              </div>

              <div className="sm:col-span-6 md:col-span-3">
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  id="stock"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm sm:text-base"
                />
              </div>

              <div className="sm:col-span-6">
                <div className="flex items-start">
                  <div className="flex h-5 items-center">
                    <input
                      id="featured"
                      name="featured"
                      type="checkbox"
                      checked={formData.featured}
                      onChange={handleChange}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="featured" className="font-medium text-gray-700">
                      Featured Product
                    </label>
                    <p className="text-gray-500 text-xs sm:text-sm">This product will be featured on the homepage.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Images */}
          <div className="bg-white shadow-sm rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-medium text-gray-900">Images</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                Upload product images. The first image will be used as the main product image.
              </p>
            </div>

            <div>
              <div className="mt-1 flex justify-center px-4 sm:px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <PhotoIcon className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-gray-400" />
                  <div className="flex flex-col sm:flex-row text-center sm:text-left sm:items-center justify-center text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-white font-medium text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:text-indigo-500 mx-auto sm:mx-0"
                    >
                      <span>Upload images</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={(formData.images?.length || 0) >= MAX_IMAGES}
                      />
                    </label>
                    <p className="sm:pl-1 text-xs sm:text-sm">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 10MB
                  </p>
                  {formData.images && formData.images.length > 0 && (
                    <p className="text-xs text-gray-500">
                      {formData.images.length} of {MAX_IMAGES} images uploaded
                    </p>
                  )}
                </div>
              </div>

              {formData.images && formData.images.length > 0 && (
                <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={image.preview || image.url}
                        alt={`Preview ${index + 1}`}
                        className={`h-24 sm:h-32 w-full object-cover rounded-md cursor-pointer ${image.isPrimary ? 'ring-2 ring-indigo-500' : 'opacity-90 hover:opacity-100'}`}
                        onClick={() => setPrimaryImage(index)}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 sm:p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove image"
                      >
                        <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                      </button>
                      {image.isPrimary && (
                        <span className="absolute bottom-1 left-1 bg-indigo-600 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded">
                          Primary
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end space-y-3 sm:space-y-0 space-y-reverse sm:space-x-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex justify-center items-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}