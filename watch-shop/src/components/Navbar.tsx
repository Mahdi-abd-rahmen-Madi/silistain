import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, Mail, LogIn } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Cart } from './Cart';
import EmailSignIn from './auth/EmailSignIn';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showEmailSignIn, setShowEmailSignIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartItems, toggleCart } = useCart();
  const { currentUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
        setIsMenuOpen(false);
      }
      if (isProfileOpen && !target.closest('.profile-menu')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, isProfileOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items
  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' }
  ] as const;

  const handleLogout = async () => {
    await logout();
    setIsProfileOpen(false);
    navigate('/');
  };

  // Calculate total items in cart
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <Cart />
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile menu button - Left side */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hamburger-button p-2 text-gray-700 hover:text-accent focus:outline-none"
                aria-label="Toggle menu"
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Logo - Center on mobile */}
            <div className="flex-1 flex justify-center md:justify-start">
              <Link to="/" className="text-2xl font-bold text-accent">
                Silistain
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-accent transition-colors font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side - Icons */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* Cart */}
              <button
                onClick={toggleCart}
                className="p-2 text-gray-700 hover:text-accent relative"
                aria-label="Shopping cart"
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </button>

              {/* Profile Icon - Always visible on all screen sizes */}
              <div className="relative profile-menu">
                <button 
                  onClick={() => {
                    if (currentUser) {
                      setIsProfileOpen(!isProfileOpen);
                    } else {
                      navigate('/login');
                    }
                  }}
                  className="p-2 text-gray-700 hover:text-accent relative"
                  aria-expanded={isProfileOpen}
                  aria-haspopup={!!currentUser}
                  aria-label={currentUser ? 'User menu' : 'Sign in'}
                >
                  {currentUser ? (
                    currentUser.avatar_url ? (
                      <img 
                        src={currentUser.avatar_url} 
                        alt="Profile"
                        className="h-6 w-6 rounded-full object-cover"
                        onError={(e) => {
                          // Fallback to initials if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-indigo-700">
                          {currentUser.email ? currentUser.email[0].toUpperCase() : 'U'}
                        </span>
                      </div>
                    )
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                </button>
                
                {currentUser && (
                  <div 
                    className={`absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 ${isProfileOpen ? 'block' : 'hidden'}`}
                    role="menu"
                    aria-orientation="vertical"
                    aria-labelledby="user-menu"
                  >
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                      {currentUser.email}
                    </div>
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link 
                      to="/favorites" 
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Favorites
                    </Link>
                    {currentUser.isAdmin && (
                      <Link 
                        to="/admin/dashboard" 
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center"
                      role="menuitem"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

      {/* Email Sign In Modal */}
      {showEmailSignIn && (
        <EmailSignIn 
          onClose={() => setShowEmailSignIn(false)}
          onSwitchToSignUp={() => {
            setShowEmailSignIn(false);
            // You can implement a sign-up flow here if needed
          }}
        />
      )}

      {/* Mobile menu */}
        <div
          id="mobile-menu"
          className={`mobile-menu md:hidden fixed inset-y-0 left-0 w-64 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ boxShadow: '2px 0 10px rgba(0,0,0,0.1)' }}
          aria-hidden={!isMenuOpen}
        >
          <div className="pt-16 pb-6 px-6 h-full overflow-y-auto">
            <nav className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-gray-700 hover:text-accent py-3 text-lg font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Removed duplicate profile links since they're now in the profile dropdown */}
              {currentUser && (
                <>
                  <div className="border-t border-gray-200 my-2" />
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left text-gray-700 hover:text-accent py-3 text-lg font-medium flex items-center"
                  >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                  </button>
                </>
              )}
            </nav>
          </div>
        </div>
        
        {/* Overlay */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </header>
    </>
  );
};

export default Navbar;
