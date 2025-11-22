import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
// Using standard HTML elements with Tailwind classes
import { Trash2, Edit, Save, X, Plus } from 'lucide-react';
import { toast } from 'sonner';

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function BrandsTab() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Brand>>({
    name: '',
    slug: '',
    description: '',
    logo_url: '',
    website_url: '',
    is_active: true,
  });

  // Load brands
  const loadBrands = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setBrands(data || []);
    } catch (err) {
      console.error('Error loading brands:', err);
      setError(err instanceof Error ? err.message : 'Failed to load brands');
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Auto-generate slug from name
    if (name === 'name' && !editingId) {
      const slug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug
      }));
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      logo_url: '',
      website_url: '',
      is_active: true,
    });
    setEditingId(null);
    setIsAdding(false);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setError(null);
      
      if (!formData.name) {
        throw new Error('Brand name is required');
      }

      if (editingId) {
        // Update existing brand
        const { error } = await supabase
          .from('brands')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Brand updated successfully');
      } else {
        // Create new brand
        const { error } = await supabase
          .from('brands')
          .insert([{
            ...formData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }]);

        if (error) throw error;
        toast.success('Brand created successfully');
      }

      // Refresh brands and reset form
      await loadBrands();
      resetForm();
    } catch (err) {
      console.error('Error saving brand:', err);
      setError(err instanceof Error ? err.message : 'Failed to save brand');
      toast.error('Failed to save brand');
    }
  };

  // Handle edit
  const handleEdit = (brand: Brand) => {
    setFormData({
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      logo_url: brand.logo_url || '',
      website_url: brand.website_url || '',
      is_active: brand.is_active,
    });
    setEditingId(brand.id);
    setIsAdding(true);
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this brand? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await loadBrands();
      toast.success('Brand deleted successfully');
    } catch (err) {
      console.error('Error deleting brand:', err);
      toast.error('Failed to delete brand');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Brands</h2>
        <button 
          onClick={() => {
            resetForm();
            setIsAdding(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Brand
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">
            {editingId ? 'Edit Brand' : 'Add New Brand'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Brand Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. Rolex, Omega"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug || ''}
                  onChange={handleInputChange}
                  placeholder="e.g. rolex, omega"
                  required
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logo_url"
                  name="logo_url"
                  value={formData.logo_url || ''}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  id="website_url"
                  name="website_url"
                  value={formData.website_url || ''}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white p-2 border"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="is_active" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Active
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="is_active"
                    name="is_active"
                    type="checkbox"
                    checked={formData.is_active ?? true}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description || ''}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                placeholder="Enter brand description..."
              />
            </div>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setIsAdding(false);
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </button>
              <button 
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save className="mr-2 h-4 w-4" />
                {editingId ? 'Update' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : brands.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">No brands found. Add your first brand to get started.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <div className="shadow overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Slug</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {brands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {brand.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {brand.slug}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          brand.is_active 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {brand.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(brand)}
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(brand.id)}
                            className="p-1.5 rounded-md text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
