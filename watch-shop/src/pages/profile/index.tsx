import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { useOrders } from '../../context/OrdersContext';
import { ProductCard } from '../../components/ProductCard';
import { OrderCard } from '../../components/OrderCard';
import { Button } from '../../components/ui/Button';
import { Heart, User, LogOut, Package, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import { Product } from '../../types/product';

// Extend the User type to include favorites
type UserWithFavorites = {
  id: string;
  email: string | null;
  favorites?: string[];
  createdAt?: string | Date;
};

const Profile = () => {
  const { currentUser, logout } = useAuth();
  const { favorites, loading: favoritesLoading, error: favoritesError } = useFavorites();
  const { orders, loading: ordersLoading, error: ordersError, fetchRecentOrders } = useOrders();
  const [activeTab, setActiveTab] = useState('favorites');
  const navigate = useNavigate();
  
  // Refresh orders when switching to the orders tab
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'orders') {
      fetchRecentOrders(2);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (favoritesLoading && activeTab === 'favorites') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const isLoading = (activeTab === 'favorites' && favoritesLoading) || 
                   (activeTab === 'orders' && ordersLoading);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {activeTab === 'favorites' ? 'Loading your favorites...' : 'Loading your orders...'}
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Please sign in to view your profile</h2>
          <Button onClick={() => navigate('/login')}>Sign In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 pt-10 pb-6 sm:pt-12 sm:pb-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header - More compact on mobile */}
        <div className="bg-white rounded-lg shadow-sm sm:shadow-md p-5 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gray-100 flex-shrink-0 flex items-center justify-center">
              <User className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {currentUser?.email?.split('@')[0] || 'User'}
              </h1>
              {currentUser?.user_metadata?.created_at && (
                <p className="text-sm sm:text-base text-gray-500 mt-1">
                  Member since {new Date(currentUser.user_metadata.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              onClick={handleSignOut} 
              className="mt-3 sm:mt-0 w-full sm:w-auto justify-center"
              size="sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tabs - Improved for mobile */}
        <Tabs.Root 
          className="w-full" 
          value={activeTab}
          onValueChange={handleTabChange}
          defaultValue="favorites"
        >
          <div className="sticky top-0 sm:top-16 z-10 bg-white border-b border-gray-200 -mx-3 sm:mx-0 px-3 sm:px-0">
            <Tabs.List className="flex w-full overflow-x-auto hide-scrollbar">
              <Tabs.Trigger
                value="favorites"
                className={`flex-1 sm:flex-none px-3 py-3 sm:px-6 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'favorites'
                    ? 'text-primary border-b-2 border-primary font-semibold'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Heart className="w-4 h-4 flex-shrink-0" />
                  <span>Favorites</span>
                  <span className="ml-1 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                    {favorites.length}
                  </span>
                </div>
              </Tabs.Trigger>
              <Tabs.Trigger
                value="orders"
                className={`flex-1 sm:flex-none px-3 py-3 sm:px-6 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === 'orders'
                    ? 'text-primary border-b-2 border-primary font-semibold'
                    : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent hover:border-gray-200'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Package className="w-4 h-4 flex-shrink-0" />
                  <span>My Orders</span>
                  {orders.length > 0 && (
                    <span className="ml-1 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                      {orders.length}
                    </span>
                  )}
                </div>
              </Tabs.Trigger>
            </Tabs.List>
          </div>

          <Tabs.Content value="favorites" className="pt-4 sm:pt-6">
            {favoritesError ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-lg p-6 shadow-sm">
                <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
                <p className="text-red-500 mb-4">Error loading favorites: {favoritesError}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12 sm:py-16 bg-white rounded-lg p-6 shadow-sm">
                <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-800">No favorites yet</h3>
                <p className="text-gray-500 mt-2 max-w-md mx-auto">Save your favorite watches to see them here</p>
                <Button 
                  onClick={() => navigate('/shop')} 
                  className="mt-4"
                  size="sm"
                >
                  Browse Watches
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
                {favorites.map((product: Product) => (
                  <div key={product.id} className="hover:shadow-md transition-shadow duration-200 rounded-lg overflow-hidden h-full">
                    <ProductCard 
                      product={product} 
                      onAddToCart={() => {}}
                    />
                  </div>
                ))}
              </div>
            )}
          </Tabs.Content>
          
          <Tabs.Content value="orders" className="pt-4 sm:pt-6">
            {ordersError ? (
              <div className="text-center py-8 sm:py-12 bg-white rounded-lg p-6 shadow-sm">
                <AlertCircle className="w-12 h-12 mx-auto text-red-400 mb-4" />
                <p className="text-red-500 mb-4">Error loading orders: {ordersError}</p>
                <Button 
                  onClick={() => fetchRecentOrders(2)}
                  variant="outline"
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="text-center py-8 sm:py-12">
                  <Package className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-800">No orders yet</h3>
                  <p className="text-gray-500 mt-2 mb-6">Your recent orders will appear here</p>
                  <Button 
                    onClick={() => navigate('/shop')}
                    variant="outline"
                    size="sm"
                  >
                    Start Shopping
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 sm:space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                    <OrderCard order={order} />
                  </div>
                ))}
                <div className="flex justify-center mt-6">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate('/account/orders')}
                  >
                    View All Orders
                  </Button>
                </div>
              </div>
            )}
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};

export default Profile;