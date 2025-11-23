import { useEffect, useState } from 'react';
import { getCachedImageUrl } from '@/utils/imageCache';

interface CachedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | { url: string } | undefined;
  fallbackSrc?: string;
  showLoader?: boolean;
}

export const CachedImage = ({
  src,
  alt = '',
  className = '',
  fallbackSrc = '/placeholder-watch.jpg',
  showLoader = true,
  ...props
}: CachedImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) {
        if (isMounted) {
          setError(true);
          setIsLoading(false);
        }
        return;
      }

      try {
        setIsLoading(true);
        const url = await getCachedImageUrl(src);
        if (isMounted && url) {
          setImageSrc(url);
          setError(false);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        if (isMounted) {
          setError(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [src]);

  if (isLoading && showLoader) {
    return (
      <div 
        className={`bg-gray-100 animate-pulse ${className}`}
        style={props.style}
      />
    );
  }

  if (error || !imageSrc) {
    return (
      <img
        {...props}
        src={fallbackSrc}
        alt={alt}
        className={className}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          if (target.src !== fallbackSrc) {
            target.src = fallbackSrc;
          }
        }}
      />
    );
  }

  return (
    <img
      {...props}
      src={imageSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        if (target.src !== fallbackSrc) {
          target.src = fallbackSrc;
          setError(true);
        }
      }}
    />
  );
};

export default CachedImage;
