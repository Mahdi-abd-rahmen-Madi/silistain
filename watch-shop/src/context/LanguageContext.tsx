import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import i18n from 'i18next';

type LanguageContextType = {
  language: string;
  setLanguage: (lang: string) => void;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [language, setLanguageState] = useState<string>('fr'); // Default to French

  // Set language based on user's role
  useEffect(() => {
    if (currentUser?.email?.endsWith('@admin.com')) {
      setLanguage('en'); // Force English for admin
    }
  }, [currentUser]);

  const setLanguage = (lang: string) => {
    if (currentUser?.email?.endsWith('@admin.com')) {
      // Don't allow changing language for admin users
      return;
    }
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
