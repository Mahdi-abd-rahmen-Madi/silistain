import { useTranslation } from 'react-i18next';

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur'];

/**
 * Custom hook to determine the text direction based on the current language
 * @returns 'rtl' for right-to-left languages, 'ltr' for left-to-right languages
 */
export const useLanguageDirection = (): 'rtl' | 'ltr' => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.split('-')[0]; // Handle cases like 'en-US' or 'ar-SA'
  
  return RTL_LANGUAGES.includes(currentLang) ? 'rtl' : 'ltr';
};

export default useLanguageDirection;
