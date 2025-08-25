import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { ProductCard } from '../../components/ProductCard';
import { Button } from '../../components/ui/Button';
import { Heart, User, LogOut } from 'lucide-react';
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
  const { favorites, loading, error } = useFavorites();
  const [activeTab, setActiveTab] = useState('favorites');
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-12 h-12 text-gray-400" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl font-bold">{currentUser?.email || 'User'}</h1>
              {currentUser?.user_metadata?.created_at && (
                <p className="text-gray-600">
                  Member since {new Date(currentUser.user_metadata.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
            <Button variant="outline" onClick={handleSignOut} className="mt-4 md:mt-0">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs.Root 
          className="w-full" 
          defaultValue="favorites"
          onValueChange={setActiveTab}
        >
          <Tabs.List className="flex border-b border-gray-200 mb-8">
            <Tabs.Trigger
              value="favorites"
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'favorites'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Favorites ({favorites.length})
              </div>
            </Tabs.Trigger>
            <Tabs.Trigger
              value="orders"
              className={`px-6 py-3 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Orders
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="favorites" className="pt-4">
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-500">Error loading favorites: {error}</p>
                <Button 
                  onClick={() => window.location.reload()} 
                  className="mt-4"
                  variant="outline"
                >
                  Retry
                </Button>
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={() => {
                      // Add to cart logic
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Heart className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No favorite items yet</h3>
                <p className="mt-2 text-gray-500">Save your favorite watches to see them here</p>
                <Button className="mt-6" onClick={() => navigate('/shop')}>
                  Browse Watches
                </Button>
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="orders" className="pt-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium mb-4">Order History</h3>
              <p className="text-gray-500">You haven't placed any orders yet.</p>
            </div>
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};

export default Profile;