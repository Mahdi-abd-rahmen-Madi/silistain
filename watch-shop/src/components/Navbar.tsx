import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Menu, X, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import LanguageSelector from './LanguageSelector';
import { Cart } from './Cart';
import { motion } from 'framer-motion';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartItems, toggleCart } = useCart();
  const { currentUser } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerButtonRef = useRef<HTMLButtonElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (window.innerWidth >= 768 && isProfileOpen && !target.closest('.profile-menu')) {
        setIsProfileOpen(false);
      }

      if (isMenuOpen && !target.closest('.mobile-menu') && !target.closest('.hamburger-button')) {
        setIsMenuOpen(false);
      }
      if (isProfileOpen && window.innerWidth < 768 && !target.closest('.mobile-profile-dropdown')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen, isProfileOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Focus management for mobile menu
  useEffect(() => {
    if (isMenuOpen) {
      const firstLink = mobileMenuRef.current?.querySelector('a') as HTMLElement | null;
      firstLink?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      hamburgerButtonRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigation = [
    { name: t('navbar.home') || 'Home', href: '/' },
    { name: t('navbar.shop') || 'Shop', href: '/shop' },
    { name: t('navbar.contact') || 'Contact', href: '/contact' },
  ];

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  return (
    <>
      <Cart />

      {/* Fixed Header */}
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? 'bg-white shadow-md' : 'bg-white/90 backdrop-blur-sm'
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile hamburger (left) */}
            <div className="flex items-center md:hidden">
              <button
                ref={hamburgerButtonRef}
                onClick={() => setIsMenuOpen(true)}
                className="hamburger-button p-2 text-gray-700 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent rounded"
                aria-label={t('navbar.open_menu')}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>

            {/* Logo */}
            <div className="flex-1 flex justify-center md:justify-start">
              <Link
                to="/"
                className="text-2xl font-bold text-accent"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsProfileOpen(false);
                }}
              >
                silistain
              </Link>
            </div>

            {/* Mobile Navigation - Always visible */}
            <div className="md:hidden flex-1 flex justify-center">
              <div className="flex items-center space-x-6 overflow-x-auto px-2 hide-scrollbar">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`text-sm font-medium whitespace-nowrap ${
                      location.pathname === item.href
                        ? 'text-accent'
                        : 'text-gray-700 hover:text-accent'
                    } transition-colors`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile right icons */}
            <div className="md:hidden flex items-center space-x-2">
              <button
                onClick={toggleCart}
                className="p-2 text-gray-700 hover:text-accent relative"
                aria-label={t('navbar.shopping_cart')}
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
                className="p-2 text-gray-700 hover:text-accent"
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
                aria-label={t('navbar.user_menu')}
              >
                <div className="relative h-6 w-6">
                  {currentUser?.avatar_url ? (
                    <img
                      src={currentUser.avatar_url}
                      alt={t('navbar.profile')}
                      className="absolute inset-0 h-full w-full rounded-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : null}
                  <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-indigo-700" />
                  </div>
                </div>
              </button>
            </div>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-6">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-gray-700 hover:text-accent transition-colors font-medium"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Desktop right icons */}
            <div className="hidden md:flex items-center space-x-4">
              <LanguageSelector />
              <button
                onClick={toggleCart}
                className="p-2 text-gray-700 hover:text-accent relative"
                aria-label={t('navbar.shopping_cart')}
              >
                <ShoppingCart className="h-6 w-6" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </span>
                )}
              </button>

              <div className="relative profile-menu">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="p-2 text-gray-700 hover:text-accent"
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  aria-label={t('navbar.user_menu')}
                >
                  <div className="relative h-6 w-6">
                    {currentUser?.avatar_url ? (
                      <img
                        src={currentUser.avatar_url}
                        alt={t('navbar.profile')}
                        className="absolute inset-0 h-full w-full rounded-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                    ) : null}
                    <div className="h-full w-full rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="h-4 w-4 text-indigo-700" />
                    </div>
                  </div>
                </button>

                {isProfileOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg py-1 z-50"
                    role="menu"
                    aria-orientation="vertical"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
                      {currentUser?.email || t('navbar.guest')}
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
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Full-Page Mobile Menu — Only navigation items, centered */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[99999] overflow-hidden bg-white">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label={t('navbar.main_menu')}
          >
            {/* Close button */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={t('navbar.close_menu')}
            >
              <X className="h-6 w-6 text-gray-700" />
            </button>

            {/* Centered menu items */}
            <nav className="flex flex-col items-center space-y-8">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className="text-2xl font-medium text-gray-800 hover:text-accent transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </motion.div>
        </div>
      )}

      {/* Mobile Profile Dropdown */}
      {isProfileOpen && window.innerWidth < 768 && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-25 z-[1001]"
            onClick={() => setIsProfileOpen(false)}
          />
          <div
            className="mobile-profile-dropdown fixed top-16 right-4 w-56 bg-white rounded-md shadow-lg py-1 z-[1002]"
            role="menu"
            aria-orientation="vertical"
          >
            <div className="px-4 py-2 text-sm text-gray-500 border-b border-gray-100">
              {currentUser?.email || t('navbar.guest')}
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
        </>
      )}
    </>
  );
};

export default Navbar;