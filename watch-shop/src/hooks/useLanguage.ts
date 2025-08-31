import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import i18n from 'i18next';

export const useLanguage = () => {
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.email?.endsWith('@admin.com')) {
      i18n.changeLanguage('en');
    } else {
      // Default to French for non-admin users or when not logged in
      const savedLanguage = localStorage.getItem('i18nextLng') || 'fr';
      i18n.changeLanguage(savedLanguage);
    }
  }, [currentUser]);

  return i18n.language;
};
