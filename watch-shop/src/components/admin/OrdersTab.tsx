import { useState, useEffect } from 'react';
import { Order } from '../../types/order';
import { useLocationSelection } from '../../hooks/useLocationSelection';

interface OrdersTabProps {
  orders: Order[];
  loading: boolean;
  error: string | null;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onUpdateOrder: (order: Order) => Promise<void>; // Made it a required function that returns a promise
}

export const OrdersTab = ({
  orders,
  loading,
  error,
  onUpdateOrderStatus,
  onUpdateOrder, // Destructure the prop
}: OrdersTabProps) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isViewingOrder, setIsViewingOrder] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editedOrder, setEditedOrder] = useState<Order | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const {
    governorates,
    delegations,
    cities,
    selectedGovernorate,
    selectedDelegation,
    selectedCity,
    loading: locationLoading,
    error: locationError,
    handleGovernorateChange,
    handleDelegationChange,
    setSelectedCity,
  } = useLocationSelection();

  // Filter orders based on statusFilter
  const filteredOrders = statusFilter 
    ? orders.filter(order => order.status === statusFilter)
    : orders;

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsViewingOrder(true);
  };

  const handleEditOrder = (order: Order) => {
    // Create a deep copy to avoid direct mutation
    const orderCopy = JSON.parse(JSON.stringify(order));
    setEditedOrder(orderCopy);
    setSelectedOrder(order);
    setIsEditingOrder(true);
    
    // Initialize location selection with the order's address
    if (order.shippingAddress.governorate) {
      handleGovernorateChange(order.shippingAddress.governorate);
      
      if (order.shippingAddress.city) {
        // Find the city object from your cities array
        const city = cities.find(c => c.name === order.shippingAddress.city);
        if (city) {
          setSelectedCity(city);
        }
      }
    }
  };

  const handleStatusChange = (orderId: string, newStatus: Order['status']) => {
    onUpdateOrderStatus(orderId, newStatus);
  };

  const handleSaveChanges = async () => {
    if (!editedOrder) return;
    
    setIsSaving(true);
    setSaveError(null);
    
    try {
      // Update the order with all changes
      await onUpdateOrder(editedOrder);
      
      // Close the modal
      setIsEditingOrder(false);
      setEditedOrder(null);
    } catch (error) {
      console.error('Error saving order:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save order');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-lg font-medium text-gray-900">Orders</h2>
        <div className="w-full sm:w-auto">
          <select
            className="block w-full pl-3 pr-10 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden rounded-md">
        <ul className="divide-y divide-gray-200">
          {filteredOrders.length === 0 ? (
            <li className="p-4 text-center text-gray-500">
              {statusFilter 
                ? `No ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} orders found.` 
                : 'No orders found.'}
            </li>
          ) : (
            filteredOrders.map((order) => (
              <li key={order.id} className="hover:bg-gray-50">
                <div className="p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center">
                      <p className="text-sm font-medium text-indigo-600 truncate">
                        Order #{order.orderNumber}
                      </p>
                      <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:flex sm:justify-between sm:items-center">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      ${order.total.toFixed(2)}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate col-span-2">
                      {order.shippingAddress.city}, {order.shippingAddress.governorate}
                    </p>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="w-full sm:w-auto">
                      <select
                        className="block w-full text-xs sm:text-sm border rounded p-1.5"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => handleViewOrder(order)}
                        className="text-xs sm:text-sm px-2.5 py-1.5 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditOrder(order)}
                        className="text-xs sm:text-sm px-2.5 py-1.5 border border-transparent rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && isViewingOrder && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsViewingOrder(false)}></div>
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                  <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Order Details</h2>
                      <div className="ml-3 h-7 flex items-center">
                        <button
                          type="button"
                          className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                          onClick={() => setIsViewingOrder(false)}
                        >
                          <span className="sr-only">Close panel</span>
                          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="flow-root">
                        <h3 className="text-lg font-medium text-gray-900">Order #{selectedOrder.orderNumber}</h3>
                        <div className="mt-2 text-sm text-gray-500">
                          Placed on {new Date(selectedOrder.createdAt).toLocaleDateString()}
                        </div>
                        
                        <div className="mt-6">
                          <h4 className="font-medium text-gray-900">Items</h4>
                          <ul className="mt-2 divide-y divide-gray-200">
                            {selectedOrder.items.map((item) => (
                              <li key={item.productId} className="py-4 flex">
                                <div className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md overflow-hidden">
                                  <img
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-center object-cover"
                                  />
                                </div>

                                <div className="ml-4 flex-1 flex flex-col">
                                  <div>
                                    <div className="flex justify-between text-base font-medium text-gray-900">
                                      <h3>{item.name}</h3>
                                      <p className="ml-4">${item.price.toFixed(2)}</p>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">Qty: {item.quantity}</p>
                                  </div>
                                  <div className="flex-1 flex items-end justify-between text-sm">
                                    <p className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</p>
                                  </div>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mt-6 border-t border-b border-gray-200 py-6">
                          <h4 className="font-medium text-gray-900">Shipping Address</h4>
                          <div className="mt-2 text-sm text-gray-500">
                            <p>{selectedOrder.shippingAddress.firstName} {selectedOrder.shippingAddress.lastName}</p>
                            <p>{selectedOrder.shippingAddress.address}</p>
                            <p>
                              {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.governorate}
                            </p>
                            <p>{selectedOrder.shippingAddress.postalCode}</p>
                            <p className="mt-2">{selectedOrder.shippingAddress.phone}</p>
                            <p>{selectedOrder.shippingAddress.email}</p>
                          </div>
                        </div>

                        <div className="mt-6">
                          <h4 className="font-medium text-gray-900">Order Total</h4>
                          <div className="mt-2 text-2xl font-bold text-gray-900">
                            ${selectedOrder.total.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => {
                          setIsViewingOrder(false);
                          setIsEditingOrder(true);
                          // Create a deep copy for editing
                          const orderCopy = JSON.parse(JSON.stringify(selectedOrder));
                          setEditedOrder(orderCopy);
                        }}
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                      >
                        Edit order
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsViewingOrder(false)}
                        className="ml-3 bg-indigo-600 border border-transparent rounded-md shadow-sm py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {editedOrder && isEditingOrder && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsEditingOrder(false)}></div>
            <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-md">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                  <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                    <div className="flex items-start justify-between">
                      <h2 className="text-lg font-medium text-gray-900">Edit Order</h2>
                      <div className="ml-3 h-7 flex items-center">
                        <button
                          type="button"
                          className="-m-2 p-2 text-gray-400 hover:text-gray-500"
                          onClick={() => setIsEditingOrder(false)}
                        >
                          <span className="sr-only">Close panel</span>
                          <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {saveError && (
                      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{saveError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-8">
                      <form className="space-y-6">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Customer Information</h3>
                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                              <label htmlFor="first-name" className="block text-sm font-medium text-gray-700">
                                First name
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="first-name"
                                  name="first-name"
                                  autoComplete="given-name"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.shippingAddress.firstName}
                                  onChange={(e) => setEditedOrder({
                                    ...editedOrder,
                                    shippingAddress: {
                                      ...editedOrder.shippingAddress,
                                      firstName: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="last-name" className="block text-sm font-medium text-gray-700">
                                Last name
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="last-name"
                                  name="last-name"
                                  autoComplete="family-name"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.shippingAddress.lastName}
                                  onChange={(e) => setEditedOrder({
                                    ...editedOrder,
                                    shippingAddress: {
                                      ...editedOrder.shippingAddress,
                                      lastName: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-4">
                              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                              </label>
                              <div className="mt-1">
                                <input
                                  id="email"
                                  name="email"
                                  type="email"
                                  autoComplete="email"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.shippingAddress.email}
                                  onChange={(e) => setEditedOrder({
                                    ...editedOrder,
                                    shippingAddress: {
                                      ...editedOrder.shippingAddress,
                                      email: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-4">
                              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                                Phone
                              </label>
                              <div className="mt-1">
                                <input
                                  id="phone"
                                  name="phone"
                                  type="tel"
                                  autoComplete="tel"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.shippingAddress.phone}
                                  onChange={(e) => setEditedOrder({
                                    ...editedOrder,
                                    shippingAddress: {
                                      ...editedOrder.shippingAddress,
                                      phone: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-6">
                              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                                Address
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="address"
                                  name="address"
                                  autoComplete="street-address"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.shippingAddress.address}
                                  onChange={(e) => setEditedOrder({
                                    ...editedOrder,
                                    shippingAddress: {
                                      ...editedOrder.shippingAddress,
                                      address: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="governorate" className="block text-sm font-medium text-gray-700">
                                Governorate
                              </label>
                              <div className="mt-1">
                                <select
                                  id="governorate"
                                  name="governorate"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.shippingAddress.governorate}
                                  onChange={(e) => {
                                    // Update both local state and editedOrder
                                    handleGovernorateChange(e.target.value);
                                    setEditedOrder({
                                      ...editedOrder,
                                      shippingAddress: {
                                        ...editedOrder.shippingAddress,
                                        governorate: e.target.value
                                      }
                                    });
                                  }}
                                >
                                  <option value="">Select a governorate</option>
                                  {governorates.map((gov) => (
                                    <option key={gov} value={gov}>
                                      {gov}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="delegation" className="block text-sm font-medium text-gray-700">
                                Delegation
                              </label>
                              <div className="mt-1">
                                <select
                                  id="delegation"
                                  name="delegation"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.shippingAddress.delegation || ''}
                                  onChange={(e) => {
                                    // Update both local state and editedOrder
                                    handleDelegationChange(e.target.value);
                                    setEditedOrder({
                                      ...editedOrder,
                                      shippingAddress: {
                                        ...editedOrder.shippingAddress,
                                        delegation: e.target.value
                                      }
                                    });
                                  }}
                                  disabled={!selectedGovernorate}
                                >
                                  <option value="">Select a delegation</option>
                                  {delegations.map((del) => (
                                    <option key={del} value={del}>
                                      {del}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                                City
                              </label>
                              <div className="mt-1">
                                <select
                                  id="city"
                                  name="city"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.shippingAddress.city}
                                  onChange={(e) => {
                                    const city = cities.find(c => c.id === e.target.value);
                                    if (city) {
                                      setSelectedCity(city);
                                      setEditedOrder({
                                        ...editedOrder,
                                        shippingAddress: {
                                          ...editedOrder.shippingAddress,
                                          city: city.name
                                        }
                                      });
                                    }
                                  }}
                                  disabled={!selectedDelegation}
                                >
                                  <option value="">Select a city</option>
                                  {cities.map((city) => (
                                    <option key={city.id} value={city.id}>
                                      {city.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="postal-code" className="block text-sm font-medium text-gray-700">
                                Postal code
                              </label>
                              <div className="mt-1">
                                <input
                                  type="text"
                                  id="postal-code"
                                  name="postal-code"
                                  autoComplete="postal-code"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.shippingAddress.postalCode}
                                  onChange={(e) => setEditedOrder({
                                    ...editedOrder,
                                    shippingAddress: {
                                      ...editedOrder.shippingAddress,
                                      postalCode: e.target.value
                                    }
                                  })}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-gray-200">
                          <h3 className="text-lg font-medium text-gray-900 mb-4">Order Status</h3>
                          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                              <label htmlFor="order-status" className="block text-sm font-medium text-gray-700">
                                Status
                              </label>
                              <div className="mt-1">
                                <select
                                  id="order-status"
                                  name="order-status"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.status}
                                  onChange={(e) => {
                                    setEditedOrder({
                                      ...editedOrder,
                                      status: e.target.value as Order['status']
                                    });
                                  }}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="processing">Processing</option>
                                  <option value="shipped">Shipped</option>
                                  <option value="delivered">Delivered</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                              </div>
                            </div>

                            <div className="sm:col-span-3">
                              <label htmlFor="payment-status" className="block text-sm font-medium text-gray-700">
                                Payment Status
                              </label>
                              <div className="mt-1">
                                <select
                                  id="payment-status"
                                  name="payment-status"
                                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                  value={editedOrder.paymentStatus}
                                  onChange={(e) => {
                                    setEditedOrder({
                                      ...editedOrder,
                                      paymentStatus: e.target.value as Order['paymentStatus']
                                    });
                                  }}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="paid">Paid</option>
                                  <option value="refunded">Refunded</option>
                                  <option value="failed">Failed</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                    <div className="flex justify-between">
                      <button
                        type="button"
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        onClick={() => setIsEditingOrder(false)}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className={`ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                          isSaving ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        onClick={handleSaveChanges}
                        disabled={isSaving}
                      >
                        {isSaving ? 'Saving...' : 'Save changes'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};