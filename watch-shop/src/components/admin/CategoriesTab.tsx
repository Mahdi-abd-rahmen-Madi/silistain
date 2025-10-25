import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, PhotoIcon } from '@heroicons/react/24/outline';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  created_at: string;
  // Additional properties for form handling
  image_file?: File;
  image_preview?: string;
}

export default function CategoriesTab() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Partial<Category>>({});

  // Load categories
  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
      console.error('Error loading categories:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, type } = e.target;
    
    if (type === 'file') {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setCurrentCategory(prev => ({
          ...prev,
          image_file: file,
          image_preview: previewUrl
        }));
      }
      return;
    }
    
    const { value } = e.target as HTMLInputElement | HTMLTextAreaElement;
    setCurrentCategory(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && { slug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })
    }));
  };

  // Save category (create or update)
  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCategory.name) {
      setError('Category name is required');
      return;
    }

    try {
      setError('');
      setSuccess('');
      
      if (currentCategory.id) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: currentCategory.name,
            slug: currentCategory.slug,
            description: currentCategory.description || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentCategory.id);
          
        if (error) throw error;
        setSuccess('Category updated successfully');
      } else {
        // Create new category
        const { data, error } = await supabase
          .from('categories')
          .insert([
            {
              name: currentCategory.name,
              slug: currentCategory.slug,
              description: currentCategory.description || null
            }
          ])
          .select()
          .single();
          
        if (error) throw error;
        setSuccess('Category created successfully');
      }
      
      // Reset form and reload categories
      resetForm();
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
      console.error('Error saving category:', err);
    }
  };

  // Delete a category
  const deleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
      return;
    }
    
    try {
      setError('');
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setSuccess('Category deleted successfully');
      await loadCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
      console.error('Error deleting category:', err);
    }
  };

  // Edit a category
  const editCategory = (category: Category) => {
    setCurrentCategory(category);
    setIsEditing(true);
    setIsAdding(true);
  };

  // Reset form
  const resetForm = () => {
    // Revoke any object URLs to prevent memory leaks
    if (currentCategory.image_preview) {
      URL.revokeObjectURL(currentCategory.image_preview);
    }
    setCurrentCategory({});
    setIsAdding(false);
    setIsEditing(false);
    setError('');
  };

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Categories</h3>
        <button
          type="button"
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Category
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Form */}
      {isAdding && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium">{isEditing ? 'Edit' : 'Add New'} Category</h4>
            <button
              type="button"
              onClick={resetForm}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <form onSubmit={saveCategory} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={currentCategory.name || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                Slug
              </label>
              <input
                type="text"
                id="slug"
                name="slug"
                value={currentCategory.slug || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-gray-50"
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">URL-friendly version of the name (auto-generated)</p>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={currentCategory.description || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Category Image
              </label>
              <div className="mt-1 flex items-center">
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span>Upload Image</span>
                  <input
                    id="image-upload"
                    name="image-upload"
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={handleInputChange}
                  />
                </label>
                {currentCategory.image_preview || currentCategory.image_url ? (
                  <div className="ml-4 relative">
                    <img
                      src={currentCategory.image_preview || currentCategory.image_url}
                      alt="Category preview"
                      className="h-16 w-16 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (currentCategory.image_preview) {
                          URL.revokeObjectURL(currentCategory.image_preview);
                        }
                        setCurrentCategory(prev => ({
                          ...prev,
                          image_file: undefined,
                          image_preview: undefined,
                          image_url: undefined
                        }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <div className="ml-4 h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
                    <PhotoIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-500">Recommended size: 400x400px</p>
            </div>
            
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isEditing ? 'Update' : 'Create'} Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No categories found. Click "Add Category" to get started.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {categories.map((category) => (
              <li key={category.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {category.image_url && (
                      <div className="flex-shrink-0 h-16 w-16 mr-4">
                        <img
                          src={category.image_url}
                          alt={category.name}
                          className="h-full w-full object-cover rounded-md"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {category.name}
                      </p>
                      {category.description && (
                        <p className="text-sm text-gray-500 truncate">
                          {category.description}
                        </p>
                      )}
                      <div className="mt-1 flex items-center text-xs text-gray-500">
                        <span>Slug: {category.slug}</span>
                        <span className="mx-1">•</span>
                        <span>Created: {new Date(category.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex space-x-2">
                    <button
                      type="button"
                      onClick={() => editCategory(category)}
                      className="text-indigo-600 hover:text-indigo-900"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(category.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
