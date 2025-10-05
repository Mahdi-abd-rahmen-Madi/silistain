import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';
import { Cart } from './Cart';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartItems, toggleCart } = useCart();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  
  // Close dropdown when clicking outside (desktop only, mobile handled by overlay)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (window.innerWidth >= 768) { // Only for desktop
        const target = event.target as HTMLElement;
        const profileMenu = target.closest('.profile-menu');
        if (isProfileOpen && !profileMenu) {
          setIsProfileOpen(false);
        }
      }
      
      if (isMenuOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
          setIsMenuOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, isProfileOpen]);

  // Close mobile menu and profile dropdown when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Focus management for mobile menu
  useEffect(() => {
    if (isMenuOpen) {
      // Focus first focusable element when menu opens
      const firstFocusable = document.querySelector('#mobile-menu [tabindex="0"]') as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isMenuOpen]);

  // Add scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation items
  const navigation = [
    { name: t('navbar.home'), href: '/' },
    { name: t('navbar.shop'), href: '/shop' },
    { name: t('navbar.contact'), href: '/contact' }
  ] as const;

  // Calculate total items in cart
  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <Cart />
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm'}`}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Always on left for desktop, hidden on mobile */}
            <div className="hidden md:flex items-center">
              <Link to="/" className="text-2xl font-bold text-accent">
                silistain
              </Link>
            </div>

            {/* Mobile menu button - Left side */}
            <div className="flex items-center md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hamburger-button p-2 text-gray-700 hover:text-accent focus:outline-none"
                aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
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

            {/* Logo - Center on mobile, hidden on desktop */}
            <div className="flex-1 flex justify-center md:hidden">
              <Link to="/" className="text-2xl font-bold text-accent">
                silistain
              </Link>
            </div>
            
            {/* Mobile icons - Right side */}
            <div className="md:hidden flex items-center space-x-2">
              <LanguageSelector />
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
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="p-2 text-gray-700 hover:text-accent relative"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                aria-label="User menu"
              >
                <div className="relative h-6 w-6">
                  {currentUser?.avatar_url && (
                    <img 
                      src={currentUser.avatar_url} 
                      alt="Profile"
                      className="absolute inset-0 h-full w-full rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  )}
                  <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-700" />
                  </div>
                </div>
              </button>
              
              {isProfileOpen && (
                <div 
                  className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
                  onClick={() => setIsProfileOpen(false)}
                />
              )}
              {/* Mobile Profile Dropdown */}
              <div 
                className={`absolute top-14 right-4 w-56 bg-white rounded-md shadow-lg py-1 z-50 ${isProfileOpen ? 'block' : 'hidden'}`}
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="mobile-user-menu"
              >
                <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                  {currentUser?.email || 'User'}
                </div>
                <Link 
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={() => setIsProfileOpen(false)}
                >
                  {t('navbar.profile')}
                </Link>
                <Link 
                  to="/favorites"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                  onClick={() => setIsProfileOpen(false)}
                >
                  {t('profile.favorites')}
                </Link>
                {currentUser?.isAdmin && (
                  <Link 
                    to="/admin/dashboard" 
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    {t('profile.admin_dashboard')}
                  </Link>
                )}
              </div>
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

            {/* Desktop Icons - Right side */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSelector />
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

              {/* Profile Icon */}
              <div className="relative profile-menu">
                <button 
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="p-2 text-gray-700 hover:text-accent relative"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <div className="relative h-6 w-6">
                    {currentUser?.avatar_url && (
                      <img 
                        src={currentUser.avatar_url} 
                        alt="Profile"
                        className="absolute inset-0 h-full w-full rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-700" />
                    </div>
                  </div>
                </button>
                
                {isProfileOpen && (
                  <div 
                    className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
                    onClick={() => setIsProfileOpen(false)}
                  />
                )}
                <div 
                  className={`absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50 ${isProfileOpen ? 'block' : 'hidden'}`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                    {currentUser?.email || 'User'}
                  </div>
                  <Link 
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    {t('navbar.profile')}
                  </Link>
                  <Link 
                    to="/favorites"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    {t('profile.favorites')}
                  </Link>
                  {currentUser?.isAdmin && (
                    <Link 
                      to="/admin/dashboard" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      {t('profile.admin_dashboard')}
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={`mobile-menu md:hidden fixed inset-y-0 left-0 w-64 bg-white z-40 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
        style={{ boxShadow: '2px 0 10px rgba(0,0,0,0.1)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Main menu"
        inert={!isMenuOpen ? true : undefined}
      >
        <div className="pt-16 pb-6 px-6 h-full overflow-y-auto">
          <nav className="flex flex-col space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-accent py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-md"
                onClick={() => setIsMenuOpen(false)}
                tabIndex={isMenuOpen ? 0 : -1}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Overlay */}
      {isMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
    </>
  );
};

export default Navbar;
