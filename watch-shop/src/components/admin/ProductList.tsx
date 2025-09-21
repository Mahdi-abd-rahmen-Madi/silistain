import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../../context/ProductContext';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '../../lib/utils';

export default function ProductList() {
  const { products, deleteProduct, loading } = useProducts();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, imageUrl?: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        setDeletingId(id);
        await deleteProduct(id, imageUrl);
      } catch (error) {
        console.error('Error deleting product:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by adding a new product.</p>
        <div className="mt-6">
          <Link
            to="/admin/products/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <svg
              className="-ml-1 mr-2 h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            New Product
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg">
      <div className="px-3 py-4 sm:px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-medium text-gray-900">Products</h3>
        <Link
          to="/admin/products/new"
          className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Product
        </Link>
      </div>
      
      {/* Mobile View - Card Layout */}
      <div className="sm:hidden divide-y divide-gray-200">
        {products.map((product) => (
          <div key={product.id} className={`p-3 ${deletingId === product.id ? 'opacity-50' : ''}`}>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 h-16 w-16">
                {product.imageUrl ? (
                  <img className="h-16 w-16 rounded-md object-cover" src={product.imageUrl} alt={product.name} />
                ) : (
                  <div className="h-16 w-16 rounded-md bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs text-center p-1">No image</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{product.name}</h4>
                  <div className="text-sm font-medium text-gray-900">{formatPrice(product.price)}</div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{product.description}</p>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-800">
                    {product.category || 'Uncategorized'}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${(product.stock || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {(product.stock || 0)} in stock
                  </span>
                  {product.featured && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800">
                      Featured
                    </span>
                  )}
                </div>
                <div className="mt-2 flex justify-end space-x-2">
                  <Link
                    to={`/admin/products/edit/${product.id}`}
                    className="text-indigo-600 hover:text-indigo-900 p-1"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => product.id && handleDelete(product.id, product.imageUrl)}
                    disabled={deletingId === product.id}
                    className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Desktop View - Table Layout */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="relative px-4 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id} className={deletingId === product.id ? 'opacity-50' : ''}>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {product.imageUrl ? (
                        <img className="h-10 w-10 rounded-md object-cover" src={product.imageUrl} alt={product.name} />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      <div className="text-xs text-gray-500 line-clamp-1">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 capitalize">{product.category || '-'}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900">{formatPrice(product.price)}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${(product.stock || 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {(product.stock || 0)} in stock
                  </span>
                </td>
                <td className="px-4 py-3">
                  {product.featured ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      Featured
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <Link
                      to={`/admin/products/edit/${product.id}`}
                      className="text-indigo-600 hover:text-indigo-900 p-1"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => product.id && handleDelete(product.id, product.imageUrl || undefined)}
                      disabled={deletingId === product.id}
                      className="text-red-600 hover:text-red-900 p-1 disabled:opacity-50"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
