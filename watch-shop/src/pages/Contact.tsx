import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaMapMarkerAlt, FaWhatsapp, FaClock, FaPhone } from 'react-icons/fa';
import { FaTiktok, FaFacebookF } from 'react-icons/fa6';

export default function Contact() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-6 px-3 sm:pt-28 sm:pb-8 sm:px-4 lg:px-8">
      <div className="max-w-4xl mx-auto px-2 sm:px-0">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 lg:text-5xl sm:tracking-tight">
            {t('contact.title')}
          </h1>
          <p className="mt-2 sm:mt-3 max-w-2xl mx-auto text-lg sm:text-xl text-gray-500">
            {t('contact.subtitle')}
          </p>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-xl sm:rounded-2xl">
          <div className="p-4 sm:p-6 md:p-8 lg:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10 lg:gap-12">
              {/* Left Column - Contact Information */}
              <div className="space-y-6 sm:space-y-8">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{t('contact.our_information')}</h2>
                <div className="space-y-5 sm:space-y-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2.5 sm:p-3">
                      <FaMapMarkerAlt className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">{t('contact.location')}</h3>
                      <p className="mt-0.5 sm:mt-1 text-sm sm:text-base text-gray-600">{t('contact.location_address')}</p>
                      <p className="mt-0.5 text-xs sm:text-sm text-gray-500">{t('contact.location_description')}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2.5 sm:p-3">
                      <FaClock className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">{t('contact.working_hours')}</h3>
                      <p className="mt-0.5 sm:mt-1 text-sm sm:text-base text-gray-600">{t('contact.working_hours_value')}</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="flex-shrink-0 bg-indigo-100 rounded-lg p-2.5 sm:p-3">
                      <FaWhatsapp className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900">{t('contact.whatsapp')}</h3>
                      <a 
                        href="https://wa.me/21655171771" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-block mt-0.5 sm:mt-1 text-sm sm:text-base text-indigo-600 hover:text-indigo-800 hover:underline active:text-indigo-900"
                      >
                        {t('contact.phone_number')}
                      </a>
                      <p className="mt-0.5 text-xs sm:text-sm text-gray-500">{t('contact.whatsapp_description')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Social Media */}
              <div className="mt-8 md:mt-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{t('contact.follow_us')}</h2>
                <div className="space-y-3 sm:space-y-4">
                  <a
                    href="https://www.facebook.com/moriskos.watches"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0 bg-blue-100 rounded-lg p-2 sm:p-3">
                      <FaFacebookF className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{t('contact.facebook')}</h3>
                      <p className="mt-0.5 text-sm sm:text-base text-gray-600 truncate">{t('contact.facebook_handle')}</p>
                    </div>
                  </a>

                  <a
                    href="https://www.tiktok.com/@silistain"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="flex-shrink-0 bg-black rounded-lg p-2 sm:p-3">
                      <FaTiktok className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">{t('contact.tiktok')}</h3>
                      <p className="mt-0.5 text-sm sm:text-base text-gray-600 truncate">{t('contact.tiktok_handle')}</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
