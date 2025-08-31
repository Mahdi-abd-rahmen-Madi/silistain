import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNewsletterSubscription } from '../hooks/useNewsletterSubscription';
import { toast } from 'react-hot-toast';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { email, setEmail, subscribe, isLoading, isSuccess, error } = useNewsletterSubscription();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const success = await subscribe(email);
      if (success) {
        toast.success('Successfully subscribed to our newsletter!');
      } else if (error) {
        toast.error(error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <footer className="bg-gray-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.quick_links')}</h3>
            <ul className="space-y-2">
              <li><a href="/shop" className="text-gray-300 hover:text-white transition-colors">{t('footer.shop')}</a></li>
              <li><a href="/profile" className="text-gray-300 hover:text-white transition-colors">{t('footer.profile')}</a></li>
              <li><a href="/contact" className="text-gray-300 hover:text-white transition-colors">{t('footer.contact')}</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">{t('footer.newsletter')}</h3>
            <p className="text-gray-300 mb-4">{t('footer.newsletter_description')}</p>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('footer.email_placeholder')} 
                  className="px-4 py-2 w-full rounded-l-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-accent"
                  required
                  disabled={isLoading || isSubmitting}
                />
                <button 
                  type="submit"
                  disabled={isLoading || isSubmitting}
                  className={`bg-accent hover:bg-accent-dark text-white px-4 py-2 rounded-r-md transition-colors ${
                    (isLoading || isSubmitting) ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading || isSubmitting ? t('footer.subscribing') : t('footer.subscribe')}
                </button>
              </div>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <div className="flex space-x-4">
            <a href="https://www.tiktok.com/@silistain" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">TikTok</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.26 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
              </svg>
            </a>
            <a href="https://wa.me/21655171771" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">WhatsApp</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17.5 14.4l-2-2c-.3-.3-.3-.8 0-1.1l.5-.5c.6-.6.9-1.3.9-2.1 0-1.7-1.4-3.1-3.1-3.1-.8 0-1.6.3-2.1.9l-.5.5c-.3.3-.8.3-1.1 0l-2-2c-.3-.3-.3-.8 0-1.1l.5-.5c1-1 2.3-1.5 3.6-1.5 3 0 5.5 2.5 5.5 5.5 0 1.3-.5 2.6-1.5 3.6l-.5.5c-.3.3-.3.8 0 1.1zM12 1C5.9 1 1 5.9 1 12c0 2.1.6 4.1 1.6 5.8l-1.3 3.8 4-1.3c1.7 1 3.6 1.6 5.7 1.6 6.1 0 11-4.9 11-11S18.1 1 12 1zm6.7 15.7c-.2.5-.6.9-1.1 1.1-.3.1-.6.2-.9.2-.3 0-.6-.1-.9-.2l-2.4-.9c-.6-.2-1.1-.7-1.3-1.3l-.9-2.4c-.2-.6-.1-1.2.2-1.7.2-.5.6-.9 1.1-1.1.3-.1.6-.2.9-.2.3 0 .6.1.9.2l2.4.9c.6.2 1.1.7 1.3 1.3l.9 2.4c.2.5.1 1.2-.2 1.7z" />
              </svg>
            </a>
            <a href="https://www.facebook.com/moriskos.watches" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
              <span className="sr-only">Facebook</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
