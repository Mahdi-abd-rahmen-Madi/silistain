import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';

type HeroMedia = {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail_url?: string;
  is_active: boolean;
  is_valid_url: boolean;
  title?: string;
  subtitle?: string;
  cta_text?: string;
  cta_link?: string;
  product_id?: string | null;
  created_at: string;
};

export const HeroSection = () => {
  const [heroMedia, setHeroMedia] = useState<HeroMedia | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchHeroMedia = async () => {
      try {
        const { data, error } = await supabase
          .from('hero_media')
          .select('*')
          .eq('is_active', true)
          .single();

        if (error) throw error;
        if (data) {
          console.log('Fetched hero media:', data);
          console.log('CTA Text:', data.cta_text);
          console.log('Product ID:', data.product_id);
          console.log('Is Active:', data.is_active);
          setHeroMedia(data);
        }
      } catch (error) {
        console.error('Error fetching hero media:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroMedia();
  }, []);

  if (loading || !heroMedia) {
    return (
      <div className="w-full h-[90vh] max-h-[1200px] min-h-[600px] bg-gray-100 animate-pulse"></div>
    );
  }

  return (
    <section className="relative w-full min-h-[80vh] sm:min-h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 -right-20 w-72 h-72 bg-accent/10 rounded-full filter blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary/5 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto py-8 sm:py-12 md:py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center min-h-[60vh] sm:min-h-[80vh]">
          {/* Text content - 7 columns on desktop */}
          <div className="lg:col-span-7 text-center lg:text-left pt-12 sm:pt-16 lg:pt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-accent/10 text-accent">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.215.33-.35.677-.35 1.005 0 .325.13.673.35 1.005.208.322.477.65.822.88a1 1 0 001.45-.385c.22-.396.13-.913-.18-1.3.43-.36.72-.89.72-1.5 0-.61-.29-1.14-.72-1.5.31-.387.4-.904.18-1.3zM8.5 1.5a1 1 0 01.894.553c.22.396.13.913-.18 1.3-.43.36-.72.89-.72 1.5 0 .61.29 1.14.72 1.5.31.387.4.904.18 1.3a1 1 0 11-1.788.894c-.345-.23-.614-.558-.822-.88-.215-.33-.35-.68-.35-1.005 0-.325.13-.673.35-1.005.208-.322.477-.65.822-.88a1 1 0 01.894-.553zM4.5 7.5a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
              </svg>
              {t('hero.new_collection')}
            </span>
            
            <h1 className="mt-4 sm:mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl md:text-5xl lg:text-6xl">
              {heroMedia.title || t('hero.title')}
            </h1>
            
            <p className="mt-4 sm:mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0">
              {heroMedia.subtitle || t('hero.subtitle')}
            </p>
            <div className="mt-4 sm:mt-6 inline-flex items-center px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-medium">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t('hero.limited_offer')}
            </div>
            
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
              <a
                href={heroMedia.product_id ? `/product/${heroMedia.product_id}` : '/shop'}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {heroMedia.cta_text || t('hero.cta')}
                <svg className="ml-2 -mr-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </a>
              <a
                href="/about" 
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                {t('hero.learn_more')}
              </a>
            </div>
            
            <div className="mt-8 sm:mt-12 flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 md:gap-8">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-accent/10 p-2 rounded-full">
                  <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                </div>
                <div className="ml-3 rtl:ml-0 rtl:mr-3">
                  <p className="text-sm font-medium text-gray-900">{t('features.free_shipping')}</p>
                  <p className="text-xs text-gray-500">{t('features.free_shipping_desc')}</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-accent/10 p-2 rounded-full">
                  <svg className="h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div className="ml-3 rtl:ml-0 rtl:mr-3">
                  <p className="text-sm font-medium text-gray-900">{t('features.warranty')}</p>
                  <p className="text-xs text-gray-500">{t('features.warranty_desc')}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Media content - 5 columns on desktop */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center lg:justify-end py-4 sm:py-8 lg:py-8 xl:py-12 2xl:py-16">
            <div className="relative w-full" style={{ maxWidth: '800px' }}>
              {/* Decorative elements */}
              {/* Decorative elements */}
              <div className="absolute -z-10 -right-4 -top-4 w-32 h-32 rounded-full bg-accent/5 blur-2xl"></div>
              <div className="absolute -z-10 -left-4 -bottom-4 w-40 h-40 rounded-full bg-primary/5 blur-2xl"></div>
              <div className="relative w-full flex items-center justify-center mx-auto">
                {heroMedia.type === 'image' ? (
                  <img
                    src={heroMedia.url}
                    alt={heroMedia.title || 'Hero banner'}
                    className="w-full h-auto max-h-[50vh] object-contain object-center rounded-2xl shadow-xl"
                    loading="eager"
                  />
                ) : (
                  <div className="relative w-full max-w-full">
                    <div style={{ 
                      width: '100%', 
                      height: 'calc(56.25vw + 10px)', 
                      maxHeight: 'calc(400px + 10px)',
                      position: 'relative',
                      overflow: 'hidden' 
                    }} className="md:h-auto md:aspect-video md:max-h-[500px] lg:max-h-[600px] xl:max-h-[700px] 2xl:max-h-[800px]">
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(to bottom, transparent 0%, transparent 5%, rgba(0,0,0,0.1) 15%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 85%, transparent 95%, transparent 100%)',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }} />
                      <div 
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: '100%',
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          pointerEvents: 'none'
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          loop
                          muted
                          playsInline
                          disablePictureInPicture
                          onLoadedData={() => setIsVideoReady(true)}
                          onContextMenu={(e) => e.preventDefault()}
                          onKeyDown={(e) => {
                            // Disable common save shortcuts
                            if ((e.ctrlKey || e.metaKey) && ['s', 'S', 'c', 'C', 'x', 'X', 'u', 'U'].includes(e.key)) {
                              e.preventDefault();
                              return false;
                            }
                          }}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            borderRadius: '1rem',
                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                            border: '1px solid rgba(243, 244, 246, 0.3)',
                            backgroundColor: 'rgba(249, 250, 251, 0.3)',
                            opacity: isVideoReady ? 1 : 0,
                            transition: 'opacity 0.8s ease-in-out',
                            pointerEvents: 'none',
                            WebkitTouchCallout: 'none',
                            WebkitUserSelect: 'none',
                            KhtmlUserSelect: 'none',
                            MozUserSelect: 'none',
                            msUserSelect: 'none',
                            userSelect: 'none'
                          }}
                          poster={heroMedia.thumbnail_url}
                          preload="auto"
                          controlsList="nodownload noremoteplayback"
                      >
                        <source src={heroMedia.url} type="video/mp4" />
                        Your browser does not support the video tag.
                        </video>
                        {/* Additional protection overlay */}
                        <div style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: 2,
                          pointerEvents: 'auto',
                          cursor: 'default'
                        }} />
                      </div>
                    </div>
                    {/* Limited Time Offer Badge - Improved positioning and responsiveness */}
                    <div className="absolute -bottom-3 -right-2 md:-right-4 md:-bottom-4 bg-white rounded-full shadow-lg p-1.5 md:p-2 z-10 animate-bounce transform scale-75 sm:scale-90 md:scale-100">
                      <div className="flex items-center space-x-1 whitespace-nowrap">
                        <div className="flex-shrink-0 bg-accent/10 p-1.5 md:p-2 rounded-full">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-accent" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-1 md:ml-2">
                          <p className="text-xs md:text-sm font-medium text-gray-900 leading-tight">Limited Time</p>
                          <p className="text-xs font-bold text-accent leading-none">20% OFF</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
