import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export default function AccountPage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not logged in, redirect to login
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // If user is an admin, redirect to admin dashboard
    if (currentUser.isAdmin) {
      navigate('/admin');
      return;
    }
  }, [currentUser, navigate]);

  if (!currentUser) {
    return null; // Will be redirected by the effect
  }

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
        <div className="md:flex">
          <div className="p-8 w-full">
            <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
              My Account
            </div>
            <div className="mt-4">
              <p className="mt-2 text-gray-500">
                Welcome back, <span className="font-medium text-gray-900">{currentUser.email}</span>
              </p>
              
              <div className="mt-6 space-y-4">
                <Link to="/favorites">
                  <Button variant="outline" className="w-full justify-start">
                    ❤️ My Favorites
                  </Button>
                </Link>
                
                <Link to="/orders">
                  <Button variant="outline" className="w-full justify-start">
                    🛒 My Orders
                  </Button>
                </Link>
                
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                >
                  👋 Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
